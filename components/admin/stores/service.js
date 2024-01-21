const BaseUserService = require('../../BaseUserService')
const { hash } = require('bcrypt')
const Store = require('../../../models/User')
const City = require('../../../models/City')
const saltNumber = 10

class AdminStoreService extends BaseUserService {
	/**
	 * Данные для страницы списка магазинов
	 */
	async main() {
		const stores = await Store.findAll({
			where: {
				role: Store.roles.STORE,
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
			stores,
			cities,
		}

		return data
	}

	/**
	 * Данные для формы добавления магазина
	 */
	async addStoreFormData() {
		const cities = await City.findAll()
		const data = {
			cities,
		}
		return data
	}

	/**
	 * Процедура добавления магазина
	 */
	async addStore(storeData) {
		const {
			username,
			login,
			pass,
			phone,
			cityId,
			address,
			latitude,
			longitude,
		} = storeData

		const active = !!storeData.active

		if (!username || !login || !pass || !cityId || !phone || !address) {
			throw new Error('Нет необходимых данных')
		}

		const password = await hash(pass, saltNumber)

		const data = {
			username,
			login,
			password,
			phone,
			cityId,
			address,
			latitude,
			longitude,
			active,
			role: Store.roles.STORE,
		}

		const newStore = await Store.create(data)

		return newStore
	}

	/**
	 * Данные для формы редактирования магазина
	 */
	async editStoreFormData(id) {
		if (!id) {
			throw new Error('Нет необходимых данных')
		}

		const store = await Store.findByPk(id)

		if (!store) {
			throw new Error('Магазин не найден')
		}

		const cities = await City.findAll()

		const data = {
			store,
			cities,
		}

		return data
	}

	/**
	 * Процедура редактирования магазина
	 */
	async editStore(storeData) {
		const {
			id,
			username,
			login,
			pass,
			phone,
			cityId,
			address,
			longitude,
			latitude,
		} = storeData

		const active = !!storeData.active

		if (!username || !login || !id || !phone || !cityId) {
			throw new Error('Нет необходимых данных')
		}

		const store = await Store.findByPk(id)

		if (!store) {
			throw new Error('Магазин не найден')
		}

		store.username = username
		store.login = login
		store.phone = phone
		store.cityId = cityId
		store.address = address
		store.latitude = latitude
		store.longitude = longitude
		store.active = active

		if (pass && pass != '') {
			store.password = await hash(pass, saltNumber)
		}

		await store.save()

		return store
	}

	/**
	 * Процедура удаления магазина
	 */
	async removeStore(id) {
		if (!id) {
			throw new Error('Нет необходимых данных')
		}

		const store = await Store.findByPk(id)

		if (!store) {
			throw new Error('Магазин не найден')
		}

		// Удаляю автара
		await this.removeAvatar(store)

		// Удаляю магазин
		await store.destroy()
	}
}

module.exports = AdminStoreService
