module.exports = (io, socket) => {
  const controller = require('./controller')(io, socket)

  // Создание заказа
  socket.on('order.create', controller.createOrder.bind(controller))

  // Редактирование
  socket.on('order.update', controller.updateOrder.bind(controller))

  // Список последних заказов
  socket.on('orders.get', controller.getOrders.bind(controller))

  // Получение заказа по id
  socket.on('orders.getbyid', controller.getOrderById.bind(controller))

  // Забор заказа
  socket.on('order.taked', controller.takedOrder.bind(controller))

  // Отмена заказа
  socket.on('order.cancel', controller.cancelOrder.bind(controller))
}
