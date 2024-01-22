// const Notification = require('../../models/Notification')

class BaseService {
  constructor(io, socket) {
    this.io = io
    this.socket = socket
    this.account = socket.account
  }

  // Получение сокетов пользователя по Id
  getUserSockets(userId, nsp = '/') {
    const { io } = this
    const namespace = io.of(nsp)
    const sockets = []
    try {
      // Проходимся по всем сокетам
      for (const [socketId, s] of namespace.sockets) {
        // Если в сокете нет пользователя (он гость), то пропускаем его
        if (!s.user) continue
        // Если в каком-то из сокетов найден нужный пользователь
        if (s.user.id == userId) {
          sockets.push(s)
        }
      }
    } catch (error) {
      console.log(error)
    }
    return sockets
  }
}

module.exports = BaseService
