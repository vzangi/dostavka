$(function () {
	const badgeTmpl = $('#badgeTmpl')
	const orderStatusesTmpl = $('#orderStatusesTmpl')
	const orderForm = $('#orderForm')
	const orderHistoryBox = $('.order-history')
	const btnShowHistory = $('.btn-show-history')

	// Принять заказ
	$('.order-list').on('click', '.accept-order', function () {
		const { id } = $(this).data()
		acceptOrder(id)
	})

	$('.btn-take-order').click(function () {
		const id = orderForm.find(`[name='id']`).val()
		acceptOrder(id, () => orderForm.modal('hide'))
	})

	function acceptOrder(orderId, success) {
		confirm(`Взять заказ №${orderId}?`).then((accept) => {
			console.log('in accept')
			if (!accept) return
			console.log('accepted')

			socket.emit('order.accept', { orderId }, (res) => {
				const { status, msg } = res
				if (status != 0) return alert(msg)
				if (success) success()
				$('.tooltip').remove()
			})
		})
	}

	// Отказаться от заказа
	$('.order-list').on('click', '.refuse-order', function () {
		const { id } = $(this).data()
		refuseOrder(id)
	})

	$('.btn-refuse-order').click(function () {
		const id = orderForm.find(`[name='id']`).val()
		refuseOrder(id, () => orderForm.modal('hide'))
	})

	function refuseOrder(orderId, success) {
		confirm(`Отказаться от заказа №${orderId}?`).then((accept) => {
			if (!accept) return

			prompt('Укажите причину отказа').then((reason) => {
				socket.emit('order.refuse', { orderId, reason }, (res) => {
					const { status, msg } = res
					if (status != 0) return alert(msg)
					if (success) success()
					$('.tooltip').remove()
				})
			})
		})
	}

	// Заказ доставлен
	$('.order-list').on('click', '.complete-order', function () {
		const { id } = $(this).data()
		orderComplete(id)
	})

	$('.btn-complete-order').click(function () {
		const id = orderForm.find(`[name='id']`).val()
		orderComplete(id, () => orderForm.modal('hide'))
	})

	function orderComplete(orderId, success) {
		confirm(`Заказ №${orderId} доставлен?`).then((accept) => {
			if (!accept) return

			socket.emit('order.complete', { orderId }, (res) => {
				const { status, msg } = res
				if (status != 0) return alert(msg)
				if (success) success()
				$('.tooltip').remove()
			})
		})
	}

	// Заказ доставлен
	$('.order-list').on('click', '.revert-order', function () {
		const { id } = $(this).data()
		revertOrder(id)
	})

	$('.order-list').on('click', '.order-id-box', function () {
		$(this).find('a').click()
	})

	$('.btn-revert-order').click(function () {
		const id = orderForm.find(`[name='id']`).val()
		revertOrder(id, () => orderForm.modal('hide'))
	})

	function revertOrder(orderId) {
		confirm(`Вернуть заказ №${orderId}?`).then((accept) => {
			if (!accept) return

			prompt('Укажите причину возврата').then((reason) => {
				socket.emit('order.rewert', { orderId, reason }, (res) => {
					const { status, msg } = res
					if (status != 0) return alert(msg)
					if (success) success()
					$('.tooltip').remove()
				})
			})
		})
	}

	orderForm.find('input,textarea').keydown(function (event) {
		event.preventDefault()
		return false
	})

	// Отображение истории на форме изменения заказа
	btnShowHistory.click(function (event) {
		event.preventDefault()
		orderHistoryBox.slideDown()
		btnShowHistory.slideUp()
		return false
	})

	// Отображение формы редактирования заказа
	$('.order-list').on('click', '.order-link', function (event) {
		event.preventDefault()

		const { id } = $(this).data()

		// Подгружаю данные заказа по сокету
		socket.emit('orders.getbyid', { orderId: id }, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			const {
				address,
				city,
				clientPhone,
				comment,
				store,
				summ,
				id,
				longitude,
				latitude,
			} = data

			orderForm.find('.modal-footer .btn').hide()

			if (data.status == 1) {
				$('.btn-take-order').show()
			}

			if (data.status == 2) {
				$('.btn-refuse-order').show()
			}

			if (data.status == 3) {
				$('.btn-revert-order').show()
				$('.btn-complete-order').show()
			}

			// Показываю маркер со статусом
			badgeTmpl
				.tmpl(statuses[data.status - 1])
				.appendTo($('.badge-box').empty())

			// Заполняю поля формы
			orderForm.find(`.order-id`).text(id)
			orderForm.find(`[name='id']`).val(id)

			// Адрес клиента/доставки
			orderForm.find(`.delivery-address`).text(address)
			orderForm
				.find('.client-address-link')
				.attr(
					'href',
					`https://yandex.ru/maps/?mode=whatshere&whatshere[point]=${longitude},${latitude}&whatshere[zoom]=17`
				)

			// Телефон клиента
			orderForm.find(`.client-phone`).text(clientPhone)
			orderForm.find(`.client-phone-link`).attr('href', `tel:${clientPhone}`)
			orderForm.find('.client-phone-box').hide()
			if (data.status != 1 && clientPhone != '') {
				orderForm.find('.client-phone-box').show()
			}

			// Название магазина
			orderForm.find(`.store-name`).text(store.username)

			// Адрес магазина
			orderForm.find(`.store-address`).text(store.address)
			orderForm
				.find('.store-address-link')
				.attr(
					'href',
					`https://yandex.ru/maps/?mode=whatshere&whatshere[point]=${store.longitude},${store.latitude}&whatshere[zoom]=17`
				)

			// Телефон магазина
			orderForm.find(`.store-phone`).text(store.phone)
			orderForm.find(`.store-phone-link`).attr('href', `tel:${store.phone}`)

			// Сумма
			orderForm.find('.order-sum-box').hide()
			if (summ) {
				orderForm.find(`.order-summ`).text(summ)
				orderForm.find('.order-sum-box').show()
			}

			// Комментарий
			orderForm.find('.order-comment-box').hide()
			if (comment && comment != '') {
				orderForm.find(`.order-comment`).text(comment)
				orderForm.find('.order-comment-box').show()
			}

			// Маршрут между магазином и клиентом
			const routeLink = `https://yandex.ru/maps/?mode=routes&rtext=${store.latitude},${store.longitude}~${latitude},${longitude}&rtt=auto`
			orderForm.find('.route-link').attr('href', routeLink)

			// Отображаю историю статусов
			orderStatusesTmpl.tmpl(data).appendTo(orderHistoryBox.empty())
			bsTooltips()
			orderHistoryBox.hide()
			btnShowHistory.show()

			// Отображаю форму
			orderForm.modal('show')
		})

		return false
	})
})
