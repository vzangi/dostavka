const { hash } = require('bcrypt')
const Driver = require('../../../models/User')
const City = require('../../../models/City')
const BaseUserService = require('../../BaseUserService')
const saltNumber = 10

class AdminDriverService extends BaseUserService {
  async main() {
    const drivers = await Driver.findAll({
      where: {
        role: Driver.roles.DRIVER,
      },
      include: [
        {
          model: City,
        },
      ],
      order: [['id', 'desc']],
    })

    const cities = await City.findAll()

    const data = {
      drivers,
      cities,
    }

    return data
  }

  async addDriverFormData() {
    const cities = await City.findAll()
    const data = {
      cities,
    }
    return data
  }

  async addDriver(driverData) {
    const { username, login, pass, phone, cityId, address, wallet } = driverData

    driverData.active = !!driverData.active
    driverData.online = !!driverData.online

    if (
      !username ||
      !login ||
      !pass ||
      !cityId ||
      !phone ||
      !address ||
      !wallet
    ) {
      throw new Error('Нет необходимых данных')
    }

    driverData.password = await hash(pass, saltNumber)
    delete driverData.pass

    const data = {
      role: Driver.roles.DRIVER,
      ...driverData,
    }

    const driver = await Driver.create(data)

    return driver
  }

  async editDriverFormData(id) {
    if (!id) {
      throw new Error('Нет необходимых данных')
    }

    const driver = await Driver.findByPk(id)

    if (!driver) {
      throw new Error('Курьер не найден')
    }

    const cities = await City.findAll()

    const data = {
      driver,
      cities,
    }

    return data
  }

  async editDriver(driverData) {
    const { id, username, login, pass, phone, cityId, address, wallet } =
      driverData

    if (
      !username ||
      !login ||
      !id ||
      !phone ||
      !cityId ||
      !address ||
      !wallet
    ) {
      throw new Error('Нет необходимых данных')
    }

    const driver = await Driver.findByPk(id)

    if (!driver) {
      throw new Error('Курьер не найден')
    }

    driver.active = !!driverData.active
    driver.online = !!driverData.online
    driver.username = username
    driver.login = login
    driver.phone = phone
    driver.cityId = cityId
    driver.address = address
    driver.wallet = wallet

    if (pass && pass != '') {
      driver.password = await hash(pass, saltNumber)
    }

    await driver.save()

    return driver
  }

  async removeDriver(id) {
    if (!id) {
      throw new Error('Нет необходимых данных')
    }

    const driver = await Driver.findByPk(id)

    if (!driver) {
      throw new Error('Курьер не найден')
    }

    await this.removeAvatar(driver)

    await driver.destroy()
  }
}

module.exports = AdminDriverService
