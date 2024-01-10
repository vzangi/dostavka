const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

router.use(isAdmin)

router.get('/', controller.main.bind(controller))

router.get('/add', controller.addDriverForm.bind(controller))
router.post('/add', controller.addDriver.bind(controller))

router.get('/edit/:id', controller.editDriverForm.bind(controller))
router.post('/edit', controller.editDriver.bind(controller))

router.get('/delete/:id', controller.removeDriver.bind(controller))

module.exports = router
