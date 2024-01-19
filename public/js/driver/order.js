$(function () {
  $('.order-list').on('click', '.accept-order', function () {
    const { id } = $(this).data()

    if (!confirm(`Взять заказ №${id}?`)) return

    socket.emit('order.accept', { orderId: id }, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)

      //   alert(`Вы взяли заказ №${id}`)
    })
  })
})
