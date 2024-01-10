const { hash } = require('bcrypt')
const Driver = require('../../../models/User')
const saltNumber = 10

class AdminDriverService {
	async main() {
		const drivers = await Driver.findAll({
			where: {
				role: Driver.roles.DRIVER
			},
			order: [['id', 'desc']]
		})

		const data = {
			drivers,
		}

		return data
	}

	async addDriver(driverData) {

		const { username, login, pass, phone, city } = driverData

		if (!username || !login || !pass || !city || !phone) {
			throw new Error('Нет необходимых данных')
		}

		const password = await hash(pass, saltNumber)

		const data = {
			username,
			login,
			password,
			phone,
			city,
			role: Driver.roles.DRIVER,
		}

		await Driver.create(data)
	}

	async editDriverFormData(id) {
		if (!id) {
			throw new Error('Нет необходимых данных')
		}

		const driver = await Driver.findByPk(id)

		if (!driver) {
			throw new Error('Водитель не найден')
		}


		const data = {
			driver,
		}

		return data
	}

	async editDriver(driverData) {

		const { id, username, login, pass, phone, city } = driverData

		if (!username || !login || !id) {
			throw new Error('Нет необходимых данных')
		}

		const driver = await Driver.findByPk(id)

		if (!driver) {
			throw new Error('Водитель не найден')
		}

		driver.username = username
		driver.login = login
		driver.phone = phone
		driver.city = city

		if (pass && pass != '') {
			driver.password = await hash(pass, saltNumber)
		}

		await driver.save()
	}

	async removeDriver(id) {
		if (!id) {
			throw new Error('Нет необходимых данных')
		}

		const driver = await Driver.findByPk(id)

		if (!driver) {
			throw new Error('Водитель не найден')
		}

		await driver.destroy()
	}
}

module.exports = AdminDriverService