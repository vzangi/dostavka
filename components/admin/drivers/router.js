const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только администратор
router.use(isAdmin)

// Список курьеров
router.get('/', controller.main.bind(controller))

// Форма добавления курьера
router.get('/add', controller.addDriverForm.bind(controller))

// Процедура редактирования курьера
router.post('/add', controller.addDriver.bind(controller))

// Форма редактирования курьера
router.get('/edit/:id', controller.editDriverForm.bind(controller))

// Процедура редактирования курьера
router.post('/edit', controller.editDriver.bind(controller))

// Процедура удаления курьера
router.get('/delete/:id', controller.removeDriver.bind(controller))

module.exports = router
