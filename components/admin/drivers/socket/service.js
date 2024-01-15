const BaseService = require('../../../BaseService')
const Driver = require('../../../../models/User')
const City = require('../../../../models/City')
const { Op } = require('sequelize')
const User = require('../../../../models/User')

class AdminDriverService extends BaseService {
  async getDrivers(filter) {
    if (!filter) {
      throw new Error('Не указан фильтр')
    }

    const { cities, phone, name, actives, onlines } = filter
    const where = {
      role: User.roles.DRIVER,
    }

    if (cities && cities.length > 0) where.cityId = cities
    if (actives && actives.length > 0) where.active = actives
    if (onlines && onlines.length > 0) where.online = onlines

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

    const drivers = await Driver.findAll({
      where,
      order: [['username']],
      include: [
        {
          model: City,
        },
      ],
    })

    return drivers
  }
}

module.exports = AdminDriverService
