const { isAuth, isDriver } = require('../../middlewares/AuthMiddleware')
const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Только авторизованные пользователи
router.use(isAuth)

// Только курьеры
router.use(isDriver)

// Главная страница курьера
router.get('/', controller.main.bind(controller))

module.exports = router
