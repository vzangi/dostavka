const BaseService = require('../../BaseService')
const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')
const OrderStatus = require('../../../models/OrderStatus')
const OrderPretendent = require('../../../models/OrderPretendent')
const { Op } = require('sequelize')
const { isoBetweenDates } = require('../../../unit/dateHelper')
const htmlspecialchars = require('htmlspecialchars')

class DriverSocketService extends BaseService {
  async getOrders(filter) {
    const driver = this._getCurrentDriver()

    if (!filter) {
      throw new Error('Не указан фильтр')
    }

    const { statuses, address, dateFrom } = filter
    const where = {}

    where.driverId = driver.id

    if (statuses && statuses.length > 0) where.status = statuses

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
        // {
        //   model: OrderPretendent,
        //   where: {
        //     driverId: driver.id,
        //   },
        // },
      ],
    })

    return orders
  }

  async getOrderById(orderId) {
    const driver = this._getCurrentDriver()

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: City,
        },
        {
          model: User,
          as: 'driver',
          where: {
            id: driver.id,
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

    const driverSockets = this.getUserSockets(account.id, '/driver')
    driverSockets.forEach((driverSocket) => {
      driverSocket.emit('order.update', updatedOrder)
    })

    return updatedOrder
  }

  _getCurrentDriver() {
    const { account } = this

    if (!account) {
      throw new Error('Не авторизован')
    }

    if (account.role != User.roles.DRIVER) {
      throw new Error('Не курьер')
    }

    if (!account.active) {
      throw new Error('Аккаун заблокирован')
    }

    return account
  }
}

module.exports = DriverSocketService
