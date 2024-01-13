$(function () {
	const socket = io('/order')

	const orderId = $('.orderId').text()

	const btnDriverChecker = $('.btn-driver-check')
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

	// Выбор одного из курьеров
	btnDriverChecker.click(function () {
		const { id, name } = $(this).data()
		if (!confirm(`Назначить курьера ${name} исполнителем заказа?`)) return

		socket.emit('driver.set', { orderId, driverId: id }, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			location.reload()
		})
	})

	// Снять курьера с заказа
	$('#revert-driver').click(function () {
		if (!confirm('Снять курьера с заказа?')) return

		const driverId = $(this).data().driverid

		socket.emit('driver.revert', { orderId, driverId }, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			location.reload()
		})
	})

	// Отменить заказ
	$('#cancel-order').click(function () {
		if (!confirm('Отменить заказ?')) return

		socket.emit('order.cancel', { orderId }, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			location.reload()
		})
	})

	// Вернуть заказ
	$('#reboot-order').click(function () {
		if (!confirm('Вернуть заказ в работу?')) return

		socket.emit('order.reboot', { orderId }, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			location.reload()
		})
	})

	// Завершить заказ
	$('#complete-order').click(function () {
		if (!confirm('Отметить заказ выполненным?')) return

		socket.emit('order.complete', { orderId }, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			location.reload()
		})
	})
})
