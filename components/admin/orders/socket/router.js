module.exports = (io, socket) => {
  const controller = require('./controller')(io, socket)

  // Список последних сообщений
  socket.on('orders.get', controller.getOrders.bind(controller))
}
