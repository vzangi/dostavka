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
    if (!confirm(`Взять заказ №${orderId}?`)) return

    socket.emit('order.accept', { orderId }, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)
      if (success) success()
      $('.tooltip').remove()
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
    if (!confirm(`Отказаться от заказа №${orderId}?`)) return

    const reason = prompt('Укажите причину отказа')
    socket.emit('order.refuse', { orderId, reason }, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)
      if (success) success()
      $('.tooltip').remove()
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
    if (!confirm(`Заказ №${orderId} доставлен?`)) return

    socket.emit('order.complete', { orderId }, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)
      if (success) success()
      $('.tooltip').remove()
    })
  }

  // Заказ доставлен
  $('.order-list').on('click', '.revert-order', function () {
    const { id } = $(this).data()
    revertOrder(id)
  })

  $('.btn-revert-order').click(function () {
    const id = orderForm.find(`[name='id']`).val()
    revertOrder(id, () => orderForm.modal('hide'))
  })

  function revertOrder(orderId) {
    if (!confirm(`Вернуть заказ №${orderId}?`)) return

    const reason = prompt('Укажите причину возврата')
    socket.emit('order.rewert', { orderId, reason }, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)
      if (success) success()
      $('.tooltip').remove()
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
      orderForm.find(`.store-name`).text(store.username)
      orderForm.find(`[name='store-address']`).val(store.address)
      orderForm.find(`.store-phone`).text(store.phone)
      orderForm.find(`.store-phone`).attr('href', `tel:${store.phone}`)

      orderForm.find(`.order-id`).text(id)
      orderForm.find(`[name='id']`).val(id)
      orderForm.find(`.client-phone`).text('')
      if (data.status != 1) {
        orderForm.find(`.client-phone`).text(clientPhone)
        orderForm.find(`.client-phone`).attr('href', `tel:${clientPhone}`)
      }
      orderForm.find(`[name='delivery-address']`).val(address)
      orderForm.find(`[name='order-summ']`).val(summ)
      orderForm.find(`[name='order-comment']`).val(comment)

      orderForm
        .find('.client-address-link')
        .attr(
          'href',
          `https://yandex.ru/maps/?mode=whatshere&whatshere[point]=${longitude},${latitude}&whatshere[zoom]=17`
        )
      orderForm
        .find('.store-address-link')
        .attr(
          'href',
          `https://yandex.ru/maps/?mode=whatshere&whatshere[point]=${store.longitude},${store.latitude}&whatshere[zoom]=17`
        )

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
