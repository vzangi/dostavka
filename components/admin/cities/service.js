const City = require('../../../models/City')

class AdminCityService {
	/**
	 * Данные для страницы со списком городов
	 */
	async main() {
		const cities = await City.findAll({
			order: [['id', 'desc']],
		})

		const data = {
			cities,
		}

		return data
	}

	/**
	 * Данные для формы добавления города
	 */
	async addCityFormData() {
		const data = {}
		return data
	}

	/**
	 * Процедура добавления города
	 */
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

	/**
	 * Данные для формы редактирования города
	 */
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

	/**
	 * Процедура редактирования города
	 */
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

	/**
	 * Удаление города
	 */
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
