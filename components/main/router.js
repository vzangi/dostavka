const { Router } = require('express')
const router = Router()

const controller = require('./controller')

router.get('/', controller.main.bind(controller))
router.get('/contacts', controller.contacts.bind(controller))

module.exports = router
