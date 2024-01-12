const BaseService = require('../../../BaseService')
const Order = require('../../../../models/Order')
const User = require('../../../../models/User')
const City = require('../../../../models/City')

class AdminOrderService extends BaseService {
  async getOrders(filter) {
    if (!filter) {
      throw new Error('Не указан фильтр')
    }

    const { statuses, cities } = filter

    const where = {}

    if (statuses && statuses.length > 0) where.status = statuses
    if (cities && cities.length > 0) where.cityId = cities

    const orders = await Order.findAll({
      where,
      order: [['updatedAt', 'desc']],
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
}

module.exports = AdminOrderService
