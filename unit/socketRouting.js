const { validateTokenInSocket } = require('./jwt')
const { userToSocket } = require('../middlewares/AuthMiddleware')

module.exports = (io) => {
  // Пытаюсь получить пользователя по токену jwt
  io.of('/admin').use(validateTokenInSocket)
  io.of('/admin').use(userToSocket)

  // Подключение к сокету
  io.of('/admin').on('connection', (socket) => {
    const { account } = socket

    // Администратор
    if (account && account.role == 0) {
      // Роуты заказов
      require('../components/admin/orders/socket/router')(io, socket)

      // Роуты курьеров
      require('../components/admin/drivers/socket/router')(io, socket)
    }
  })
}
