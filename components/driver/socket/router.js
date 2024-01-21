module.exports = (io, socket) => {
	const controller = require('./controller')(io, socket)

	// Список последних заказов
	socket.on('orders.get', controller.getOrders.bind(controller))

	// Получение заказа по id
	socket.on('orders.getbyid', controller.getOrderById.bind(controller))

	// Взять заказ
	socket.on('order.accept', controller.acceptOrder.bind(controller))

	// Отказаться от заказа
	socket.on('order.refuse', controller.refuseOrder.bind(controller))

	// Вернуть заказ в магазин
	socket.on('order.rewert', controller.revertOrder.bind(controller))

	// Завершить заказ
	socket.on('order.complete', controller.completeOrder.bind(controller))

	// Получить баланс
	socket.on('driver.wallet', controller.getWallet.bind(controller))
}
