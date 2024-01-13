module.exports = (io, socket) => {
	const controller = require('./controller')(io, socket)

	// Список последних сообщений
	socket.on('orders.get', controller.getOrders.bind(controller))

	// Назначение курьера заказу
	socket.on('driver.set', controller.setDriver.bind(controller))

	// Снятие курьера с заказа
	socket.on('driver.revert', controller.revertDriver.bind(controller))

	// Отмена заказа
	socket.on('order.cancel', controller.cancelOrder.bind(controller))

	// Вернуть заказ в работу
	socket.on('order.reboot', controller.rebootOrder.bind(controller))

	// Завершить заказ
	socket.on('order.complete', controller.completeOrder.bind(controller))
}
