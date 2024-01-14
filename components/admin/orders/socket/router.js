module.exports = (io, socket) => {
	const controller = require('./controller')(io, socket)

	// Создание заказа
	socket.on('order.create', controller.createOrder.bind(controller))

	// Список последних заказов
	socket.on('orders.get', controller.getOrders.bind(controller))

	// Список последних сообщений
	socket.on('orders.getbyid', controller.getOrderById.bind(controller))

	// Назначение курьера заказу
	socket.on('driver.set', controller.setDriver.bind(controller))

	// Снятие курьера с заказа
	socket.on('driver.revert', controller.revertDriver.bind(controller))

	// Отмена заказа
	socket.on('order.taked', controller.takedOrder.bind(controller))

	// Отмена заказа
	socket.on('order.cancel', controller.cancelOrder.bind(controller))

	// Вернуть заказ в работу
	socket.on('order.reboot', controller.rebootOrder.bind(controller))

	// Завершить заказ
	socket.on('order.complete', controller.completeOrder.bind(controller))
}
