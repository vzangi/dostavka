const Service = require('./service')
const BaseController = require('../BaseController')

class DriverController extends BaseController {
	async main(req, res) {
		try {
			const data = await this.service.main()
			res.render('page/driver/main', data)
		} catch (error) {
			this.service.page404(res)
		}
	}

}

module.exports = new DriverController(Service)