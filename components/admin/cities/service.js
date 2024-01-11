const City = require('../../../models/City')

class AdminCityService {
  async main() {
    const cities = await City.findAll({
      order: [['id', 'desc']],
    })

    const data = {
      cities,
    }

    return data
  }

  async addCityFormData() {
    const data = {}
    return data
  }

  async addCity(cityData) {
    const { name } = cityData

    if (!name) {
      throw new Error('Нет необходимых данных')
    }

    const data = {
      name,
    }

    await City.create(data)
  }

  async editCityFormData(id) {
    if (!id) {
      throw new Error('Нет необходимых данных')
    }

    const city = await City.findByPk(id)

    if (!city) {
      throw new Error('Город не найден')
    }

    const data = {
      city,
    }

    return data
  }

  async editCity(cityData) {
    const { id, name } = cityData

    if (!name || !id) {
      throw new Error('Нет необходимых данных')
    }

    const city = await City.findByPk(id)

    if (!city) {
      throw new Error('Город не найден')
    }

    city.name = name

    await city.save()
  }

  async removeCity(id) {
    if (!id) {
      throw new Error('Нет необходимых данных')
    }

    const city = await City.findByPk(id)

    if (!city) {
      throw new Error('Город не найден')
    }

    await city.destroy()
  }
}

module.exports = AdminCityService
