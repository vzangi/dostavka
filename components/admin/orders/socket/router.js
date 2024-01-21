module.exports = (io, socket) => {
	const controller = require('./controller')(io, socket)

	// Создание заказа
	socket.on('order.create', controller.createOrder.bind(controller))

	// Редактирование
	socket.on('order.update', controller.updateOrder.bind(controller))

	// Список последних заказов
	socket.on('orders.get', controller.getOrders.bind(controller))

	// Получяение заказа по номеру
	socket.on('orders.getbyid', controller.getOrder.bind(controller))

	// Назначение курьера заказу
	socket.on('driver.set', controller.setDriver.bind(controller))

	// Снятие курьера с заказа
	socket.on('driver.revert', controller.revertDriver.bind(controller))

	// Подтверждение, что курьер забрал заказ
	socket.on('order.taked', controller.takedOrder.bind(controller))

	// Отмена заказа
	socket.on('order.cancel', controller.cancelOrder.bind(controller))

	// Вернуть заказ в работу
	socket.on('order.reboot', controller.rebootOrder.bind(controller))

	// Завершить заказ
	socket.on('order.complete', controller.completeOrder.bind(controller))
}
