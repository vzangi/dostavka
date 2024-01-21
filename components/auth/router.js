const { Router, urlencoded } = require('express')
const router = Router()
const controller = require('./controller')

// Использую отправку данных через формы
router.use(urlencoded({ extended: true }))

// Страница авторизации
router.get('/login', controller.loginPage.bind(controller))

// Процедура авторизации
router.get('/logout', controller.logout.bind(controller))

// Выход с сайта
router.post('/login', controller.loginForm.bind(controller))

// Создание администратора
router.get('/make/admin/:pass', controller.makeAdmin.bind(controller))

module.exports = router
