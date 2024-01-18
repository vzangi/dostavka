const { validateTokenInSocket } = require('./jwt')
const { userToSocket } = require('../middlewares/AuthMiddleware')
const { roles } = require('../models/User')

module.exports = (io) => {
  // Пытаюсь получить пользователя по токену jwt
  io.of('/admin').use(validateTokenInSocket)
  io.of('/admin').use(userToSocket)

  // Подключение к сокету
  io.of('/admin').on('connection', (socket) => {
    const { account } = socket

    // Администратор
    if (account && account.role == roles.ADMIN) {
      // Роуты заказов
      require('../components/admin/orders/socket/router')(io, socket)

      // Роуты курьеров
      require('../components/admin/drivers/socket/router')(io, socket)

      // Роуты магазинов
      require('../components/admin/stores/socket/router')(io, socket)
    }
  })

  // Пытаюсь получить пользователя по токену jwt
  io.of('/store').use(validateTokenInSocket)
  io.of('/store').use(userToSocket)

  // Подключение к сокету
  io.of('/store').on('connection', (socket) => {
    const { account } = socket

    // Магазин
    if (account && account.role == roles.STORE) {
      // Роуты магазина
      require('../components/store/socket/router')(io, socket)
    }
  })

  // Пытаюсь получить пользователя по токену jwt
  io.of('/driver').use(validateTokenInSocket)
  io.of('/driver').use(userToSocket)

  // Подключение к сокету
  io.of('/driver').on('connection', (socket) => {
    const { account } = socket

    // Курьер
    if (account && account.role == roles.DRIVER) {
      // Роуты курьеров
      require('../components/driver/socket/router')(io, socket)
    }
  })
}
