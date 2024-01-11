const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

router.use(isAdmin)

router.get('/', controller.main.bind(controller))

router.get('/add', controller.addOrderForm.bind(controller))
router.post('/add', controller.addOrder.bind(controller))

router.get('/edit/:id', controller.editOrderForm.bind(controller))
router.post('/edit', controller.editOrder.bind(controller))

module.exports = router
