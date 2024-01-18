const BaseService = require('../../BaseService')
const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')
const OrderStatus = require('../../../models/OrderStatus')
const { Op } = require('sequelize')
const { isoBetweenDates } = require('../../../unit/dateHelper')
const htmlspecialchars = require('htmlspecialchars')

class StoreSocketService extends BaseService {
  async createOrder(orderData) {
    const store = this._getCurrentStore()

    const { clientPhone, summ, address, latitude, longitude, comment } =
      orderData

    if (!clientPhone || !address) {
      throw new Error('Нет необходимых данных')
    }

    if (latitude == '') {
      delete orderData.latitude
    }

    if (longitude == '') {
      delete orderData.longitude
    }

    if (summ == '') {
      delete orderData.summ
    }

    orderData.storeId = store.id
    orderData.cityId = store.cityId

    const order = await Order.create(orderData)

    let createComment = `Заказ создан`
    createComment += `<br>Телефон: <b>${clientPhone}</b>`
    createComment += `<br>Адрес: <b>${address}</b>`
    if (summ) {
      createComment += `<br>Сумма: <b>${summ}</b>`
    }
    if (comment) {
      createComment += `<br>Комментарий: <b>${comment}</b>`
    }

    await OrderStatus.create({
      orderId: order.id,
      userId: store.id,
      comment: createComment,
    })

    this.io.of('/admin').emit('order.created', order)

    const storeSockets = this.getUserSockets(store.id, '/store')
    storeSockets.forEach((storeSocket) => {
      storeSocket.emit('order.created', order)
    })

    return order
  }

  async updateOrder(orderData) {
    const store = this._getCurrentStore()

    const { id, clientPhone, summ, address, latitude, longitude, comment } =
      orderData

    if (!id || !clientPhone || !address) {
      throw new Error('Нет необходимых данных')
    }

    if (latitude == '') {
      delete orderData.latitude
    }

    if (longitude == '') {
      delete orderData.longitude
    }

    const order = await this.getOrderById(id)

    if (order.storeId != store.id) {
      throw new Error('Заказ не найден')
    }

    if (order.status == Order.statuses.CANCELLED) {
      throw new Error('Заказ был отменён. Редактирование запрещено.')
    }

    if (order.status == Order.statuses.DELIVERED) {
      throw new Error('Заказ выполнен. Редактирование запрещено.')
    }

    const changes = []

    if (order.clientPhone != clientPhone) {
      order.clientPhone = clientPhone
      changes.push(`Изменён номер клиента: <b>${clientPhone}</b>`)
    }

    if (order.summ != summ) {
      order.summ = summ
      changes.push(`Изменена сумма заказа: <b>${summ}</b>`)
    }

    if (order.address != address) {
      order.address = address
      changes.push(`Изменён адрес: <b>${address}</b>`)
      if (orderData.latitude) order.latitude = orderData.latitude
      if (orderData.longitude) order.longitude = orderData.longitude
    }

    if (order.comment != comment) {
      order.comment = comment
      changes.push(`Изменён комментарий: <b>${comment}</b>`)
    }

    // Если были изменения - сообщаем об этом
    if (changes.length > 0) {
      const changesMessage = changes.join('<br>')
      const updatedOrder = await this._setNewStatus(
        order,
        order.status,
        changesMessage
      )

      this.io.of('/admin').emit('order.update', updatedOrder)

      const storeSockets = this.getUserSockets(store.id, '/store')
      storeSockets.forEach((storeSocket) => {
        storeSocket.emit('order.update', updatedOrder)
      })

      return updatedOrder
    }

    return order
  }

  async getOrders(filter) {
    const store = this._getCurrentStore()

    if (!filter) {
      throw new Error('Не указан фильтр')
    }

    const { statuses, phone, address, dateFrom } = filter
    const where = {}

    where.storeId = store.id

    if (statuses && statuses.length > 0) where.status = statuses

    if (phone && phone != '') {
      where.clientPhone = {
        [Op.substring]: phone,
      }
    }

    if (address && address != '') {
      where.address = {
        [Op.substring]: address,
      }
    }

    if (dateFrom && dateFrom != '') {
      where.createdAt = {
        [Op.between]: isoBetweenDates(dateFrom),
      }
    }

    const orders = await Order.findAll({
      where,
      order: [['id', 'desc']],
      include: [
        {
          model: User,
          as: 'store',
          attributes: ['username', 'address', 'phone'],
        },
        {
          model: User,
          as: 'driver',
          attributes: ['username', 'phone', 'address'],
        },
        {
          model: City,
        },
      ],
    })

    return orders
  }

  async getOrderById(orderId) {
    const store = this._getCurrentStore()

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: City,
        },
        {
          model: User,
          as: 'store',
          where: {
            id: store.id,
            role: User.roles.STORE,
          },
          attributes: ['id', 'username', 'address', 'phone', 'tel', 'avatar'],
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'username', 'phone', 'tel', 'avatar'],
        },
        {
          model: OrderStatus,
          include: [
            {
              model: User,
              attributes: ['id', 'username'],
            },
          ],
        },
      ],
    })

    if (!order) {
      throw new Error(`Заказ #${orderId} не найден`)
    }

    return order
  }

  async takedOrder(orderId) {
    const order = await this.getOrderById(orderId)

    if (order.status != Order.statuses.ACCEPTED) {
      throw new Error(`Заказ #${orderId} не подтверждён`)
    }

    if (!order.driverId) {
      throw new Error(`Заказу #${orderId} не назначен курьер`)
    }

    return await this._setNewStatus(
      order,
      Order.statuses.TAKED,
      'Курьер забрал заказ'
    )
  }

  async cancelOrder(orderId, reason) {
    const order = await this.getOrderById(orderId)

    if (order.status == Order.statuses.CANCELLED) {
      throw new Error(`Заказ #${orderId} уже отменён`)
    }

    if (order.status == Order.statuses.DELIVERED) {
      throw new Error(`Заказ #${orderId} уже доставлен, его нельзя отменить`)
    }

    if (order.status == Order.statuses.TAKED) {
      throw new Error(
        `Заказ #${orderId} забрал курьер, сначала он должен его вернуть`
      )
    }

    let comment = 'Магазин отменил заказ'
    if (reason)
      comment = comment + ` по причине: <b>${htmlspecialchars(reason)}</b>`

    return await this._setNewStatus(order, Order.statuses.CANCELLED, comment)
  }

  async _setNewStatus(order, status, comment) {
    const { account, io } = this

    order.status = status
    await order.save()

    await OrderStatus.create({
      status,
      orderId: order.id,
      userId: account.id,
      comment,
    })

    const updatedOrder = await this.getOrderById(order.id)

    io.of('/admin').emit('order.update', updatedOrder)

    const storeSockets = this.getUserSockets(account.id, '/store')
    storeSockets.forEach((storeSocket) => {
      storeSocket.emit('order.update', updatedOrder)
    })

    return updatedOrder
  }

  _getCurrentStore() {
    const { account } = this

    if (!account) {
      throw new Error('Не авторизован')
    }

    if (account.role != User.roles.STORE) {
      throw new Error('Не магазин')
    }

    if (!account.active) {
      throw new Error('Аккаун заблокирован')
    }

    return account
  }
}

module.exports = StoreSocketService
