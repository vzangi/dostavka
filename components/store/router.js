const { isAuth, isStore } = require('../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только авторизованные пользователи
router.use(isAuth)

// Только магазины
router.use(isStore)

// Страница управления заказами магазина
router.get('/', controller.main.bind(controller))

module.exports = router
