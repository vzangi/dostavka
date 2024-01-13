$(function () {
	const socket = io('/order')

	// id текущего заказа
	const orderId = $('.orderId').text()

	// Кнопки выбора курьера
	const btnDriverChecker = $('.btn-driver-check')

	// Поле фильтра курьера
	const driverFilter = $('#driverFilter')

	// Фильтрация курьеров в модальном окне
	driverFilter.keyup(function () {
		const v = $(this).val().toLowerCase()

		btnDriverChecker.each((_, btn) => {
			if ($(btn).text().toLowerCase().indexOf(v) >= 0) {
				$(btn).removeClass('d-none')
			} else {
				$(btn).addClass('d-none')
			}
		})
	})

	// Обработка ответа от сокета
	const callback = (res) => {
		const { status, msg } = res
		if (status != 0) return alert(msg)
		location.reload()
	}

	// Выбор одного из курьеров
	btnDriverChecker.click(function () {
		const { id, name } = $(this).data()
		if (!confirm(`Назначить курьера ${name} исполнителем заказа?`)) return
		socket.emit('driver.set', { orderId, driverId: id }, callback)
	})

	// Снять курьера с заказа
	$('#revert-driver').click(function () {
		if (!confirm('Снять курьера с заказа?')) return
		const driverId = $(this).data().driverid
		socket.emit('driver.revert', { orderId, driverId }, callback)
	})

	// Отменить заказ
	$('#cancel-order').click(function () {
		if (!confirm('Отменить заказ?')) return
		socket.emit('order.cancel', { orderId }, callback)
	})

	// Вернуть заказ
	$('#reboot-order').click(function () {
		if (!confirm('Вернуть заказ в работу?')) return
		socket.emit('order.reboot', { orderId }, callback)
	})

	// Завершить заказ
	$('#complete-order').click(function () {
		if (!confirm('Отметить заказ выполненным?')) return
		socket.emit('order.complete', { orderId }, callback)
	})

	// Курьер забрал заказ
	$('#taked-order').click(function () {
		if (!confirm('Отметить, что курьер забрал заказ?')) return
		socket.emit('order.taked', { orderId }, callback)
	})
})
