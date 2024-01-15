const BaseService = require('../../../BaseService')
const Order = require('../../../../models/Order')
const User = require('../../../../models/User')
const City = require('../../../../models/City')
const OrderStatus = require('../../../../models/OrderStatus')
const { Op } = require('sequelize')
const { isoDateFromString } = require('../../../../unit/dateHelper')

class AdminOrderService extends BaseService {
  async createOrder(orderData) {
    const {
      clientPhone,
      summ,
      storeId,
      address,
      latitude,
      longitude,
      comment,
    } = orderData

    if (!clientPhone || !storeId || !address) {
      throw new Error('Нет необходимых данных')
    }

    if (latitude == '') {
      delete orderData.latitude
    }

    if (longitude == '') {
      delete orderData.longitude
    }

    const store = await User.findByPk(storeId)

    if (!store) {
      throw new Error('Магазин не найден')
    }

    if (store.role != User.roles.STORE) {
      throw new Error('Магазин не найден')
    }

    if (!store.active) {
      throw new Error('Магазин заблокирован')
    }

    orderData.cityId = store.cityId

    const order = await Order.create(orderData)

    await OrderStatus.create({
      orderId: order.id,
      userId: this.account.id,
      comment: 'Заказ создан администратором',
    })

    this.io.of('/admin').emit('order.created', order)

    return order
  }

  async updateOrder(orderData) {
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

    order.clientPhone = clientPhone
    order.summ = summ
    order.address = address
    if (orderData.latitude) order.latitude = orderData.latitude
    if (orderData.longitude) order.latitude = orderData.longitude
    order.comment = comment

    await order.save()

    this.io.of('/admin').emit('order.update', order)

    return order
  }

  async getOrders(filter) {
    if (!filter) {
      throw new Error('Не указан фильтр')
    }

    const {
      statuses,
      cities,
      phone,
      address,
      stores,
      drivers,
      dateFrom,
      dateTo,
    } = filter
    const where = {}

    if (statuses && statuses.length > 0) where.status = statuses

    if (cities && cities.length > 0) where.cityId = cities

    if (stores && stores.length > 0) where.storeId = stores

    if (drivers && drivers.length > 0) where.driverId = drivers

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
        [Op.gte]: isoDateFromString(dateFrom),
      }
    }

    if (dateTo && dateTo != '') {
      where.createdAt = {
        [Op.lte]: isoDateFromString(dateTo, true),
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
          attributes: ['username', 'phone'],
        },
        {
          model: City,
        },
      ],
    })

    return orders
  }

  async getOrderById(orderId) {
    if (!orderId) {
      throw new Error('Не указан id заказа')
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: City,
        },
        {
          model: User,
          as: 'store',
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

  async setDriver(orderId, driverId) {
    if (!driverId) {
      throw new Error('Не указан id курьера')
    }

    const order = await this.getOrderById(orderId)

    if (order.driverId) {
      throw new Error(`Заказу #${orderId} уже назначен курьер`)
    }

    const driver = await User.findByPk(driverId, {
      attributes: ['id', 'username', 'phone', 'tel', 'active', 'online'],
    })

    if (!driver) {
      throw new Error(`Курьер #${driverId} не найден`)
    }

    if (!driver.active) {
      throw new Error(
        `Курьер #${driver.username} заблокирован и не может быть назначен для выполнения заказа`
      )
    }

    if (!driver.online) {
      throw new Error(`Курьер #${driver.username} в данный момент не работает`)
    }

    order.driverId = driverId

    return await this._setNewStatus(
      order,
      Order.statuses.ACCEPTED,
      `Администратор назначил курьера вручную - ${driver.username}`
    )
  }

  async revertDriver(orderId, driverId) {
    const order = await this.getOrderById(orderId)

    if (!order.driverId) {
      throw new Error(`Заказу #${orderId} не был назначен курьер`)
    }

    if (order.driverId != driverId) {
      throw new Error(`Заказу #${orderId} был назначен другой курьер`)
    }

    order.driverId = null

    return await this._setNewStatus(
      order,
      Order.statuses.WHAITING,
      'Курьер снят с заказа администратором'
    )
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
      'Администратор подтвердил, что курьер забрал заказ'
    )
  }

  async cancelOrder(orderId, reason) {
    const order = await this.getOrderById(orderId)

    if (order.status == Order.statuses.CANCELLED) {
      throw new Error(`Заказ #${orderId} уже отменён`)
    }

    let comment = 'Администратор отменил заказа'
    if (reason) comment = comment + ` по причине: ${reason}`

    return await this._setNewStatus(order, Order.statuses.CANCELLED, comment)
  }

  async completeOrder(orderId) {
    const order = await this.getOrderById(orderId)

    if (order.status == Order.statuses.DELIVERED) {
      throw new Error(`Заказ #${orderId} уже завершён`)
    }

    return await this._setNewStatus(
      order,
      Order.statuses.DELIVERED,
      'Администратор подтвердил выполнение заказа'
    )
  }

  async rebootOrder(orderId) {
    const order = await this.getOrderById(orderId)

    if (
      order.status != Order.statuses.CANCELLED &&
      order.status != Order.statuses.DELIVERED
    ) {
      throw new Error(`Заказ #${orderId} всё ещё в работе`)
    }

    const orderStatus = order.driverId
      ? Order.statuses.ACCEPTED
      : Order.statuses.WHAITING

    return await this._setNewStatus(
      order,
      orderStatus,
      'Администратор вернул заказ в работу'
    )
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

    return updatedOrder
  }
}

module.exports = AdminOrderService
