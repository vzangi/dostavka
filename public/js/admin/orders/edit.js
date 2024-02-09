$(function () {
  const socket = io('/admin')

  $('form').submit(function (event) {
    event.preventDefault()

    const orderData = {}
    orderData.id = $("[name='id']").val()
    orderData.clientPhone = $("[name='clientPhone']").val()
    orderData.summ = $("[name='summ']").val()
    orderData.address = $("[name='address']").val()
    orderData.latitude = $("[name='latitude']").val()
    orderData.longitude = $("[name='longitude']").val()
    orderData.comment = $("[name='comment']").val()

    socket.emit('order.update', orderData, (res) => {
      const { status, msg, data } = res
      if (status != 0) return alert(msg)

      location.href = `/admin/orders/${data.id}`
    })

    return false
  })

  $('#getPoint').click(async () => {
    const { city } = $('#getPoint').data()
    const address = $(`[name='address']`).val()
    const fullAddress = `${city}, ${address}`

    const point = await y_geocoder(fullAddress)

    if (!point) return alert('Не удалось получить координаты')

    $(`[name='latitude']`).val(point.lat)
    $(`[name='longitude']`).val(point.lon)
  })
})
