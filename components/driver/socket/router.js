module.exports = (io, socket) => {
  const controller = require('./controller')(io, socket)

  // Список последних заказов
  socket.on('orders.get', controller.getOrders.bind(controller))
}
