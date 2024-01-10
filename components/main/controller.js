const Service = require('./service')
const BaseController = require('../BaseController')

class MainController extends BaseController {
	async main(req, res) {
		try {
			const data = await this.service.main()
			res.render('page/main', data)
		} catch (error) {
			this.service.page404(res)
		}
	}

	async contacts(req, res) {
		try {
			const data = await this.service.contacts()
			res.render('page/contacts', data)
		} catch (error) {
			this.service.page404(res)
		}
	}
}

module.exports = new MainController(Service)