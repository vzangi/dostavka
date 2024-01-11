const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminDriverController extends BaseController {
	async main(req, res) {
		try {
			const data = await this.service.main()
			res.render('page/admin/drivers', data)
		} catch (error) {
			this.page404(res)
		}
	}

	async addDriverForm(req, res) {
		try {
			const data = await this.service.addDriverFormData()
			res.render('page/admin/drivers/add', data)
		} catch (error) {
			this.page404(res)
		}
	}

	async addDriver(req, res) {
		try {
			const driver = await this.service.addDriver(req.body)
			if (req.files) {
				const { avatar } = req.files
				if (avatar) {
					await this.service.setAvatar(avatar, driver)
				}
			}
			res.redirect('/admin/drivers')
		} catch (error) {
			this.page404(res)
		}
	}

	async editDriverForm(req, res) {
		try {
			const { id } = req.params
			const data = await this.service.editDriverFormData(id)
			res.render('page/admin/drivers/edit', data)
		} catch (error) {
			this.page404(res)
		}
	}

	async editDriver(req, res) {
		try {
			const driver = await this.service.editDriver(req.body)
			if (req.files) {
				const { avatar } = req.files
				if (avatar) {
					await this.service.setAvatar(avatar, driver)
				}
			}
			res.redirect('/admin/drivers')
		} catch (error) {
			this.page404(res)
		}
	}

	async removeDriver(req, res) {
		try {
			const { id } = req.params
			await this.service.removeDriver(id)

			res.redirect('/admin/drivers')
		} catch (error) {
			this.page404(res)
		}
	}
}

module.exports = new AdminDriverController(Service)
