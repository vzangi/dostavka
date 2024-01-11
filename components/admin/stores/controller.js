const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminStoreController extends BaseController {
	async main(req, res) {
		try {
			const data = await this.service.main()
			res.render('page/admin/stores', data)
		} catch (error) {
			this.page404(res)
		}
	}

	async addStoreForm(req, res) {
		try {
			const data = await this.service.addStoreFormData()
			res.render('page/admin/stores/add', data)
		} catch (error) {
			this.page404(res)
		}
	}

	async addStore(req, res) {
		try {
			const store = await this.service.addStore(req.body)
			if (req.files) {
				const { avatar } = req.files
				if (avatar) {
					await this.service.setAvatar(avatar, store)
				}
			}
			res.redirect('/admin/stores')
		} catch (error) {
			console.log(error)
			this.page404(res)
		}
	}

	async editStoreForm(req, res) {
		try {
			const { id } = req.params
			const data = await this.service.editStoreFormData(id)
			res.render('page/admin/stores/edit', data)
		} catch (error) {
			this.page404(res)
		}
	}

	async editStore(req, res) {
		try {
			const store = await this.service.editStore(req.body)
			if (req.files) {
				const { avatar } = req.files
				if (avatar) {
					await this.service.setAvatar(avatar, store)
				}
			}
			res.redirect('/admin/stores')
		} catch (error) {
			this.page404(res)
		}
	}

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
