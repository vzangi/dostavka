class BaseController {
	constructor(Service) {
		// Если в конструктор приходит сервис
		// инициализирую его
		if (Service) {
			this.service = new Service()
		}
	}

	// Процедура переводящая пользователя
	// на страницу со статусом 404 (не найдена)
	page404(res) {
		res.status(404).render('page/404')
	}
}

module.exports = BaseController
