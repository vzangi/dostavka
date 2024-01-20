const Service = require('./service')
const BaseController = require('../BaseController')

class DriverController extends BaseController {
	async main(req, res) {
		try {
			const { currentAccount } = res.locals
			const data = await this.service.main(currentAccount)
			res.render('page/driver/main', data)
		} catch (error) {
			this.page404(res)
		}
	}
}

module.exports = new DriverController(Service)
