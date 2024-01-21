const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminStoreController extends BaseController {
	/**
	 * Страница со списком магазинов
	 */
	async main(req, res) {
		try {
			const data = await this.service.main()
			res.render('page/admin/stores', data)
		} catch (error) {
			this.page404(res)
		}
	}

	/**
	 * Форма добавления магазина
	 */
	async addStoreForm(req, res) {
		try {
			const data = await this.service.addStoreFormData()
			res.render('page/admin/stores/add', data)
		} catch (error) {
			this.page404(res)
		}
	}

	/**
	 * Процедура добавления магазина
	 */
	async addStore(req, res) {
		try {
			// Создаю магазин
			const store = await this.service.addStore(req.body)
			// Если в запросе пришёл файл
			if (req.files) {
				const { avatar } = req.files
				// И этот файл - аватар
				if (avatar) {
					// Ставлю магазину аватар
					await this.service.setAvatar(avatar, store)
				}
			}
			res.redirect('/admin/stores')
		} catch (error) {
			this.page404(res)
		}
	}

	/**
	 * Форма редактирования магазина
	 */
	async editStoreForm(req, res) {
		try {
			const { id } = req.params
			const data = await this.service.editStoreFormData(id)
			res.render('page/admin/stores/edit', data)
		} catch (error) {
			this.page404(res)
		}
	}

	/**
	 * Процедура редактирования магазина
	 */
	async editStore(req, res) {
		try {
			// Редактирую магазин
			const store = await this.service.editStore(req.body)
			// Если в запросе пришёл файл
			if (req.files) {
				// И этот файл - аватар
				const { avatar } = req.files
				if (avatar) {
					// Меняю аватар магазина
					await this.service.setAvatar(avatar, store)
				}
			}
			res.redirect('/admin/stores')
		} catch (error) {
			this.page404(res)
		}
	}

	/**
	 * Процедура удаления магазина
	 */
	async removeStore(req, res) {
		try {
			const { id } = req.params
			await this.service.removeStore(id)
			res.redirect('/admin/stores')
		} catch (error) {
			this.page404(res)
		}
	}
}

module.exports = new AdminStoreController(Service)
