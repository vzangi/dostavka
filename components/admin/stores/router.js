const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

router.use(isAdmin)

router.get('/', controller.main.bind(controller))

router.get('/add', controller.addStoreForm.bind(controller))
router.post('/add', controller.addStore.bind(controller))

router.get('/edit/:id', controller.editStoreForm.bind(controller))
router.post('/edit', controller.editStore.bind(controller))

router.get('/delete/:id', controller.removeStore.bind(controller))

module.exports = router
