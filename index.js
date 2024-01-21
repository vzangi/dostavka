const { server, sequelize } = require('./unit/bootstrap')

const PORT = process.env.PORT || 5000

;(async () => {
	// Проверяю подключение к базе данных
	sequelize
		.authenticate()
		.then(async () => {
			console.log('База данных подключена.')

			// если база подключилась - запускаю сервер
			server.listen(PORT, () => {
				console.log(`Сервер запущен на порту ${PORT}`)
			})
		})
		.catch((error) => {
			console.log('Ошибка при подключении к базе данных: ', error)
		})
})()
