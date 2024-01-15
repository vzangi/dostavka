const BaseService = require('../../../BaseService')
const Store = require('../../../../models/User')
const City = require('../../../../models/City')
const { Op } = require('sequelize')
const User = require('../../../../models/User')

class AdminStoreService extends BaseService {
  async getStores(filter) {
    if (!filter) {
      throw new Error('Не указан фильтр')
    }

    const { cities, phone, name, actives } = filter
    const where = {
      role: User.roles.STORE,
    }

    if (cities && cities.length > 0) where.cityId = cities
    if (actives && actives.length > 0) where.active = actives

    if (phone && phone != '') {
      where.phone = {
        [Op.substring]: phone,
      }
    }

    if (name && name != '') {
      where.username = {
        [Op.substring]: name,
      }
    }

    const stores = await Store.findAll({
      where,
      order: [['username']],
      include: [
        {
          model: City,
        },
      ],
    })

    return stores
  }
}

module.exports = AdminStoreService
