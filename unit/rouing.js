module.exports = (app) => {
	// Проверка наличия и валидности токена авторизации
	const { validateToken } = require('./jwt')
	app.use(validateToken)

	// Добавляю пользователя в переменные шаблона, если он авторизован
	const { userToTemplate } = require('../middlewares/AuthMiddleware')
	app.use(userToTemplate)

	app.use('/', require('../components/main/router'))
	app.use('/', require('../components/auth/router'))

	app.use('/admin', require('../components/admin/router'))
	app.use('/admin/stores', require('../components/admin/stores/router'))
	app.use('/admin/drivers', require('../components/admin/drivers/router'))

	app.use('/store', require('../components/store/router'))

	app.use('/driver', require('../components/driver/router'))


	// Обработка страницы 404
	app.use((req, res, next) => {
		res.status(404).render('page/404')
	})

	// Глобальный обработчик при возникновении ошибок
	app.use((err, req, res, next) => {
		console.error(err)
		res.status(404).render('page/404')
	})
}