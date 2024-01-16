$(function () {
	const orderForm = $('#orderAddForm')
	const addPhoneInput = $(`#orderAddForm [name='client-phone']`)

	// Отправка формы "Новый заказ"
	orderForm.submit(function (event) {
		event.preventDefault()

		const orderData = {}

		orderData.clientPhone = orderForm.find(`[name='client-phone']`).val()
		orderData.address = orderForm.find(`[name='delivery-address']`).val()
		orderData.latitude = orderForm.find(`[name='latitude']`).val()
		orderData.longitude = orderForm.find(`[name='longitude']`).val()
		orderData.summ = orderForm.find(`[name='order-summ']`).val()
		orderData.comment = orderForm.find(`[name='order-comment']`).val()

		if (orderData.latitude == '' || orderData.longitude == '') {
			const cityName = orderForm.find(`[name='city-name']`).val()
			const fullAddress = `${cityName}, ${orderData.address}`
			geocoder(fullAddress).then((point) => {
				orderData.latitude = point.lat
				orderData.longitude = point.lon
				createOrder(orderData)
			})
		} else {
			createOrder(orderData)
		}

		return false
	})

	// Создание заказа
	function createOrder(orderData) {
		socket.emit('order.create', orderData, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			orderForm.find('input,textarea').val('')
			orderForm.modal('hide')
		})
	}

	// Фильтрация ввода в поле телефонного номера
	addPhoneInput.keydown(function (event) {
		const { key } = event
		const val = $(this).val()

		if (key.length > 1) return true
		if (val == '' && key == '+') return true

		if (val.indexOf('+') == 0 && val.length == 12) return false
		if (val.indexOf('+') < 0 && val.length == 11) return false

		if ('0123456789'.indexOf(key) >= 0) return true

		return false
	})

	// Фильтрация при вставке телефонного номера
	addPhoneInput.bind('paste', function (event) {
		const pastedData = event.originalEvent.clipboardData.getData('text')
		const v = pastedData
			.split('')
			.filter((c, i) => {
				if (i == 0 && c == '+') return true
				return '0123456789'.indexOf(c) >= 0
			})
			.join('')
		setTimeout(() => addPhoneInput.val(v), 100)
	})
})
