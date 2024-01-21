const { isAdmin } = require('../../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только администратор
router.use(isAdmin)

// Главная страница админа
router.get('/', controller.main.bind(controller))

module.exports = router
