const Service = require('./service')
const BaseController = require('../BaseController')

class StoreController extends BaseController {
	async main(req, res) {
		try {
			const { currentAccount } = res.locals
			const data = await this.service.main(currentAccount)
			res.render('page/store/main', data)
		} catch (error) {
			this.page404(res)
		}
	}
}

module.exports = new StoreController(Service)
