class BaseController {
	constructor(Service) {
		if (Service) {
			this.service = new Service()
		}
	}

	page404(res) {
		res.status(404).render('page/404')
	}
}

module.exports = BaseController