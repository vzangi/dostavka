const { Router } = require('express')
const router = Router()
const controller = require('./controller')

// Главная страница
router.get('/', controller.main.bind(controller))

// Страница контактов
router.get('/contacts', controller.contacts.bind(controller))

module.exports = router
