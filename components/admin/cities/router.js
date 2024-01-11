const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

router.use(isAdmin)

router.get('/', controller.main.bind(controller))

router.get('/add', controller.addCityForm.bind(controller))
router.post('/add', controller.addCity.bind(controller))

router.get('/edit/:id', controller.editCityForm.bind(controller))
router.post('/edit', controller.editCity.bind(controller))

router.get('/delete/:id', controller.removeCity.bind(controller))

module.exports = router
