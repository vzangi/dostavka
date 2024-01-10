const { hash } = require('bcrypt')
const Store = require('../../../models/User')
const saltNumber = 10

class AdminStoreService {
	async main() {
		const stores = await Store.findAll({
			where: {
				role: Store.roles.STORE
			},
			order: [['id', 'desc']]
		})

		const data = {
			stores,
		}

		return data
	}

	async addStore(storeData) {

		const { username, login, pass, phone, city, address, latitude, longitude } = storeData

		if (!username || !login || !pass || !city || !phone || !address) {
			throw new Error('Нет необходимых данных')
		}

		const password = await hash(pass, saltNumber)

		const data = {
			username,
			login,
			password,
			phone,
			city,
			address,
			latitude,
			longitude,
			role: Store.roles.STORE,
		}

		await Store.create(data)
	}

	async editStoreFormData(id) {
		if (!id) {
			throw new Error('Нет необходимых данных')
		}

		const store = await Store.findByPk(id)

		if (!store) {
			throw new Error('Магазин не найден')
		}


		const data = {
			store,
		}

		return data
	}

	async editStore(storeData) {

		const { id, username, login, pass, phone, city, address, longitude, latitude } = storeData

		if (!username || !login || !id) {
			throw new Error('Нет необходимых данных')
		}

		const store = await Store.findByPk(id)

		if (!store) {
			throw new Error('Магазин не найден')
		}

		store.username = username
		store.login = login
		store.phone = phone
		store.city = city
		store.address = address
		store.latitude = latitude
		store.longitude = longitude

		if (pass && pass != '') {
			store.password = await hash(pass, saltNumber)
		}

		await store.save()
	}

	async removeStore(id) {
		if (!id) {
			throw new Error('Нет необходимых данных')
		}

		const store = await Store.findByPk(id)

		if (!store) {
			throw new Error('Магазин не найден')
		}

		await store.destroy()
	}
}

module.exports = AdminStoreService