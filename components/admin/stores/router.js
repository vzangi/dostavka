const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только администратор
router.use(isAdmin)

// Страница со списком магазинов
router.get('/', controller.main.bind(controller))

// Форма добавления магазина
router.get('/add', controller.addStoreForm.bind(controller))

// Процедура добавления магазина
router.post('/add', controller.addStore.bind(controller))

// Форма редактирования магазина
router.get('/edit/:id', controller.editStoreForm.bind(controller))

// Процедура редактирования магазина
router.post('/edit', controller.editStore.bind(controller))

// Процедура удаления магазина
router.get('/delete/:id', controller.removeStore.bind(controller))

module.exports = router
