const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminController extends BaseController {
	/**
	 * Главная страница админа
	 */
	async main(req, res) {
		try {
			res.render('page/admin/main')
		} catch (error) {
			this.service.page404(res)
		}
	}
}

module.exports = new AdminController(Service)
