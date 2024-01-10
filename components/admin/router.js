const { isAdmin } = require('../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

router.use(isAdmin)

router.get('/', controller.main.bind(controller))

module.exports = router
