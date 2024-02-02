const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только администратор
router.use(isAdmin)

// Страница списка заказов
router.get('/', controller.main.bind(controller))

// Форма создания заказа
router.get('/add', controller.addOrderForm.bind(controller))

// Процедура создания заказа
router.post('/add', controller.addOrder.bind(controller))

// Форма редактирования заказа
router.get('/edit/:id', controller.editOrderForm.bind(controller))

// Процедура редактирования заказа
router.post('/edit', controller.editOrder.bind(controller))

// Страница управения заказом
router.get('/:id', controller.getOrder.bind(controller))

// Процедура удаления заказа
router.get('/delete/:id', controller.removeOrder.bind(controller))

module.exports = router
