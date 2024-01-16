$(function () {
  const orderForm = $('#orderAddForm')

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
})
