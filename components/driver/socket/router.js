module.exports = (io, socket) => {
  const controller = require('./controller')(io, socket)

  // Список последних заказов
  socket.on('orders.get', controller.getOrders.bind(controller))

  // Список последних заказов
  socket.on('order.accept', controller.acceptOrder.bind(controller))
}
