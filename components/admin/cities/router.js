const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только администратор
router.use(isAdmin)

// Список городов
router.get('/', controller.main.bind(controller))

// Форма добавления города
router.get('/add', controller.addCityForm.bind(controller))

// Процедура добавления города
router.post('/add', controller.addCity.bind(controller))

// Форма редактирования города
router.get('/edit/:id', controller.editCityForm.bind(controller))

// Процедура редактирования города
router.post('/edit', controller.editCity.bind(controller))

// Удление города
router.get('/delete/:id', controller.removeCity.bind(controller))

module.exports = router
