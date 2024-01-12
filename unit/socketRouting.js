const { validateTokenInSocket } = require('./jwt')
const { userToSocket } = require('../middlewares/AuthMiddleware')

module.exports = (io) => {
  // Пытаюсь получить пользователя по токену jwt
  io.of('/order').use(validateTokenInSocket)
  io.of('/order').use(userToSocket)

  // Подключение к сокету
  io.of('/order').on('connection', (socket) => {
    const { account } = socket

    // Администратор
    if (account && account.role == 0) {
      // Роуты заказов
      require('../components/admin/orders/socket/router')(io, socket)
    }
  })
}
