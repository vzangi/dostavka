module.exports = (io, socket) => {
	const controller = require('./controller')(io, socket)

	// Список последних заказов
	socket.on('orders.get', controller.getOrders.bind(controller))

	// Взять заказ
	socket.on('order.accept', controller.acceptOrder.bind(controller))

	// Отказаться от заказа
	socket.on('order.refuse', controller.refuseOrder.bind(controller))

	// Завершить заказ
	socket.on('order.complete', controller.completeOrder.bind(controller))
}
