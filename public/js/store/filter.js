$(function () {
  const filterBox = $('.filter-box')
  const filterBtn = $('.btn-filter')
  const btnStartFilter = $('.btn-start-filter')
  const statusChecker = $('.status-checker')
  const ordersListBox = $('.order-list')

  const orderTmpl = $('#orderTmpl')
  const noOrdersTmpl = $('#noOrdersTmpl')

  function filter() {
    const filterData = {}
    const phone = $('#client-phone').val()
    if (phone != '') filterData.phone = phone

    const address = $('#delivery-address').val()
    if (address != '') filterData.address = address

    const dateFrom = $('#date-from').val()
    if (dateFrom != '') filterData.dateFrom = dateFrom

    // Список выбранных статусов
    filterData.statuses = statusChecker
      .filter((_, sc) => $(sc).hasClass('checked'))
      .map((_, sc) => $(sc).data().id)
      .toArray()

    socket.emit('orders.get', filterData, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)

      const { data } = res

      if (data.length == 0) {
        return noOrdersTmpl.tmpl().appendTo(ordersListBox.empty())
      }

      orderTmpl.tmpl(data).appendTo(ordersListBox.empty())

      bsTooltips()
    })
  }

  filter()

  // Запускаю фильтр если приходит новый заказ
  socket.on('order.created', (order) => {
    filter()
  })

  // Произошло обновление заказа
  socket.on('order.update', (order) => {
    // Если в таблице есть этот заказ - перезапускаем фильтр
    if ($(`tr[data-id=${order.id}]`).length == 1) filter()
  })

  // Скрыть/показать фильтр
  filterBtn.click(function () {
    filterBox.slideToggle()
  })

  // Клик на кнопке запуск фильтрации
  btnStartFilter.click(filter)

  // Клик на чекере статуса
  statusChecker.click(function () {
    $(this).toggleClass('checked')
  })

  // Выбор даты из календаря
  $('#date-from').datepicker({
    dateFormat: 'dd.mm.yy',
    firstDay: 1,
    showOtherMonths: true,
    selectOtherMonths: true,
    monthNames: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    dayNames: [
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
      'Воскресенье',
    ],
  })
})
