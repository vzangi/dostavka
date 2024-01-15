$(function () {
	const socket = io('/admin')

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

	// Обновление заказа
	const updateOrder = (order) => {
		// Показываю или скрываю кнопки управления статусом заказа
		$('.order-btns .btn').each((_, btn) => {
			const { showon } = $(btn).data()
			if (showon.indexOf(order.status) < 0) {
				$(btn).addClass('d-none')
			} else {
				$(btn).removeClass('d-none')
			}
		})

		$('#orderDataTmpl').tmpl(order).appendTo($('.order-data').empty())
		$('#orderUsersTmpl').tmpl(order).appendTo($('.order-users').empty())
		$('#orderStatusesTmpl').tmpl(order).appendTo($('.order-statuses').empty())

		bsTooltips()
	}

	// Обработка ответа от сокета
	const callback = (res) => {
		const { status, msg, data } = res
		if (status != 0) {
			alert(msg)
			return false
		}
		updateOrder(data)
		return true
	}

	// Получение данных заказа по сокету
	socket.emit('orders.getbyid', { orderId }, callback)

	// Произошло обновление заказа
	socket.on('order.update', (order) => {
		if (order.id == orderId) updateOrder(order)
	})

	// Выбор одного из курьеров
	btnDriverChecker.click(function () {
		const { id, name } = $(this).data()
		if (!confirm(`Назначить курьера ${name} исполнителем заказа?`)) return
		socket.emit('driver.set', { orderId, driverId: id }, (res) => {
			if (!callback(res)) return
			$('#driverAddForm').modal('hide')
		})
	})

	// Снять курьера с заказа
	$('.order-users').on('click', '#revert-driver', function () {
		if (!confirm('Снять курьера с заказа?')) return
		const driverId = $(this).data().driverid
		socket.emit('driver.revert', { orderId, driverId }, callback)
	})

	// Отменить заказ
	$('#cancel-order').click(function () {
		if (!confirm('Отменить заказ?')) return
		const reason = prompt('Причина отмены заказа')
		socket.emit('order.cancel', { orderId, reason }, callback)
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
