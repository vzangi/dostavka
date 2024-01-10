const { Router, urlencoded } = require('express')
const router = Router()

// Использую отправку данных через формы
router.use(urlencoded({ extended: true }))


const controller = require('./controller')

router.get('/login', controller.loginPage.bind(controller))
router.get('/logout', controller.logout.bind(controller))
router.post('/login', controller.loginForm.bind(controller))

router.get('/make/admin/:pass', controller.makeAdmin.bind(controller))

module.exports = router
