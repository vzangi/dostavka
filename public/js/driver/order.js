$(function () {
	// Принять заказ
	$('.order-list').on('click', '.accept-order', function () {
		const { id } = $(this).data()

		if (!confirm(`Взять заказ №${id}?`)) return

		socket.emit('order.accept', { orderId: id }, (res) => {
			const { status, msg } = res
			if (status != 0) return alert(msg)

			//   alert(`Вы взяли заказ №${id}`)
		})
	})

	// Отказаться от заказа
	$('.order-list').on('click', '.refuse-order', function () {
		const { id } = $(this).data()

		if (!confirm(`Отказаться от заказа №${id}?`)) return

		const reason = prompt('Укажите причину отказа')
		socket.emit('order.refuse', { orderId: id, reason }, (res) => {
			const { status, msg } = res
			if (status != 0) return alert(msg)

			//   alert(`Вы отказались от заказа №${id}`)
		})
	})

	// Заказ доставлен
	$('.order-list').on('click', '.complete-order', function () {
		const { id } = $(this).data()

		if (!confirm(`Заказ №${id} доставлен?`)) return

		socket.emit('order.complete', { orderId: id }, (res) => {
			const { status, msg } = res
			if (status != 0) return alert(msg)

			//   alert(`Вы доставили заказ №${id}`)
		})
	})
})
