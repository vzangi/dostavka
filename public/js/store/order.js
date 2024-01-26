$(function () {
  const badgeTmpl = $('#badgeTmpl')
  const orderStatusesTmpl = $('#orderStatusesTmpl')
  const orderAddForm = $('#orderAddForm')
  const orderChangeForm = $('#orderChangeForm')
  const addPhoneInput = orderAddForm.find(`[name='client-phone']`)
  const changePhoneInput = orderChangeForm.find(`[name='client-phone']`)
  const orderCancelBtn = orderChangeForm.find('.btn-cancel-order')
  const orderTakeBtn = orderChangeForm.find('.btn-take-order')
  const orderHistoryBox = $('.order-history')
  const btnShowHistory = $('.btn-show-history')

  // Отправка формы "Новый заказ"
  orderAddForm.submit(function (event) {
    event.preventDefault()

    const orderData = {}

    orderData.clientPhone = orderAddForm.find(`[name='client-phone']`).val()
    orderData.address = orderAddForm.find(`[name='delivery-address']`).val()
    orderData.latitude = orderAddForm.find(`[name='latitude']`).val()
    orderData.longitude = orderAddForm.find(`[name='longitude']`).val()
    orderData.summ = orderAddForm.find(`[name='order-summ']`).val()
    orderData.comment = orderAddForm.find(`[name='order-comment']`).val()

    if (orderData.latitude == '' || orderData.longitude == '') {
      const cityName = orderAddForm.find(`[name='city-name']`).val()
      const fullAddress = `${cityName}, ${orderData.address}`
      geocoder(fullAddress).then((point) => {
        if (point) {
          orderData.latitude = point.lat
          orderData.longitude = point.lon
        }
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

      orderAddForm.find('input,textarea').val('')
      orderAddForm.modal('hide')
    })
  }

  // Отправка формы "Редактирование заказа"
  orderChangeForm.submit(function (event) {
    event.preventDefault()

    const orderData = {}

    orderData.id = orderChangeForm.find(`[name='id']`).val()
    orderData.clientPhone = orderChangeForm.find(`[name='client-phone']`).val()
    orderData.address = orderChangeForm.find(`[name='delivery-address']`).val()
    orderData.summ = orderChangeForm.find(`[name='order-summ']`).val()
    orderData.comment = orderChangeForm.find(`[name='order-comment']`).val()

    if (
      orderData.address !=
      orderChangeForm.find(`[name='delivery-address']`).data().address
    ) {
      const cityName = orderChangeForm.find(`[name='city-name']`).val()
      const fullAddress = `${cityName}, ${orderData.address}`
      geocoder(fullAddress).then((point) => {
        orderData.latitude = point.lat
        orderData.longitude = point.lon
        updateOrder(orderData)
      })
    } else {
      updateOrder(orderData)
    }

    return false
  })

  // Изменение заказа
  function updateOrder(orderData) {
    socket.emit('order.update', orderData, (res) => {
      const { status, msg, data } = res
      if (status != 0) return alert(msg)

      orderChangeForm.find('input,textarea').val('')
      orderChangeForm.modal('hide')
    })
  }

  // Фильтрация ввода в поле телефонного номера
  addPhoneInput.keyup(keyup)
  changePhoneInput.keyup(keyup)

  function keyup(event) {
    $(this).val(tel($(this).val()))
  }

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
        orderStatuses,
        id,
      } = data

      // Если заказ выполнен или отменён - блокирую кнопки изменения
      if (data.status == 4 || data.status == 5) {
        $('.btn-cancel-order, .btn-update-order').attr('disabled', '')
      } else {
        $('.btn-cancel-order, .btn-update-order').removeAttr('disabled')
      }

      if (data.status == 2) {
        $('.btn-take-order').show()
      } else {
        $('.btn-take-order').hide()
      }

      // Показываю маркер со статусом
      badgeTmpl
        .tmpl(statuses[data.status - 1])
        .appendTo($('.badge-box').empty())

      // Заполняю поля формы
      orderChangeForm.find(`.order-id`).text(id)
      orderChangeForm.find(`[name='id']`).val(id)
      orderChangeForm.find(`[name='storeId']`).val(store.id)
      orderChangeForm.find(`[name='cityId']`).val(city.id)
      orderChangeForm.find(`[name='city-name']`).val(city.name)
      orderChangeForm.find(`[name='client-phone']`).val(clientPhone)
      orderChangeForm.find(`[name='delivery-address']`).val(address)
      orderChangeForm.find(`[name='delivery-address']`).data().address = address
      orderChangeForm.find(`[name='order-summ']`).val(summ)
      orderChangeForm.find(`[name='order-comment']`).val(comment)

      // Отображаю историю статусов

      orderStatusesTmpl.tmpl(data).appendTo(orderHistoryBox.empty())
      bsTooltips()
      orderHistoryBox.hide()
      btnShowHistory.show()

      // Отображаю форму
      orderChangeForm.modal('show')
    })

    return false
  })

  // Отображение истории на форме изменения заказа
  btnShowHistory.click(function (event) {
    event.preventDefault()
    orderHistoryBox.slideDown()
    btnShowHistory.slideUp()
    return false
  })

  // Отмена заказа
  orderCancelBtn.click(function () {
    const orderId = orderChangeForm.find(`[name='id']`).val()
    confirm('Вы уверены, что хотите отменить заказ?').then((accept) => {
      if (!accept) return

      prompt('Укажите причину отмены').then((reason) => {
        socket.emit('order.cancel', { orderId, reason }, (res) => {
          const { status, msg, data } = res
          if (status != 0) return alert(msg)

          // Скрываю форму
          orderChangeForm.modal('hide')
        })
      })
    })
  })

  // Отметить заказ отданным курьеру
  orderTakeBtn.click(function () {
    const orderId = orderChangeForm.find(`[name='id']`).val()
    confirm('Отметить, что курьер забрал заказ?').then((accept) => {
      if (!accept) return

      socket.emit('order.taked', { orderId }, (res) => {
        const { status, msg, data } = res
        if (status != 0) return alert(msg)

        // Скрываю форму
        orderChangeForm.modal('hide')
      })
    })
  })
})
