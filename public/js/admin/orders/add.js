$(function () {
	const socket = io('/order')

	$('form').submit(function (event) {
		event.preventDefault()

		const orderData = {}
		orderData.clientPhone = $("[name='clientPhone']").val()
		orderData.summ = $("[name='summ']").val()
		orderData.storeId = $("[name='storeId']").val()
		orderData.address = $("[name='address']").val()
		orderData.latitude = $("[name='latitude']").val()
		orderData.longitude = $("[name='longitude']").val()
		orderData.comment = $("[name='comment']").val()

		socket.emit('order.create', orderData, (res) => {
			const { status, msg, data } = res
			if (status != 0) return alert(msg)

			location.href = '/admin/orders'
		})

		return false
	})

	$('#getPoint').click(async () => {
		const storeId = $(`[name='storeId']`).val()
		const { city } = $(`option[value=${storeId}]`).data()
		const address = $(`[name='address']`).val()
		const fullAddress = `${city}, ${address}`

		const point = await geocoder(fullAddress)

		console.log(point)

		if (!point) return alert('Не удалось получить координаты')

		$(`[name='latitude']`).val(point.lat)
		$(`[name='longitude']`).val(point.lon)
	})
})
