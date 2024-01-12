$(function () {
  const socket = io('/order')
  const orderTmpl = $('#orderTmpl')
  const noOrdersTmpl = $('#noOrdersTmpl')
  const cityFilterTmpl = $('#cityFilterTmpl')

  const ordersListBox = $('.order-list')
  const filterBtn = $('.btn-filter')
  const filterBox = $('.filter-box')
  const statusChecker = $('.status-checker')
  const btnStartFilter = $('.btn-start-filter')
  const citiesFilterBox = $('.cities')
  const cityFilter = $('#cityFilter')
  const btnCityChecker = $('.btn-city-check')

  // Запуск фильтрации заказов
  function filter() {
    // Список выбранных статусов
    const statuses = statusChecker
      .filter((_, sc) => $(sc).hasClass('checked'))
      .map((_, sc) => $(sc).data().id)
      .toArray()

    const cities = citiesFilterBox
      .find('.city')
      .map((_, sc) => $(sc).data().id)
      .toArray()

    // Получение списка заказов через сокет
    socket.emit('orders.get', { statuses, cities }, (res) => {
      const { status, msg } = res
      if (status != 0) return alert(msg)

      const { data } = res

      if (data.length == 0) {
        return noOrdersTmpl.tmpl().appendTo(ordersListBox.empty())
      }

      orderTmpl.tmpl(data).appendTo(ordersListBox.empty())
      console.log(data)

      bsTooltips()
    })
  }

  filter()

  // Открыть блок фильтра
  filterBtn.click(function () {
    filterBox.slideToggle()
  })

  // Клик на чекере статуса
  statusChecker.click(function () {
    $(this).toggleClass('checked')
  })

  // Клик на кнопке запуск фильтрации
  btnStartFilter.click(filter)

  // Удаление города из списка фильтра
  citiesFilterBox.on('click', '.remove-city', function () {
    const { id } = $(this).parent().data()
    $(this).parent().remove()
    $(`.btn-city-check[data-id=${id}]`).show()
    $('.tooltip').remove()
  })

  // Выбор города в модальной форме фильтра
  btnCityChecker.click(function () {
    const { id, name } = $(this).data()
    $(this).hide()
    cityFilterTmpl.tmpl({ id, name }).prependTo(citiesFilterBox)
  })

  cityFilter.keyup(function () {
    const v = $(this).val()

    btnCityChecker.each((_, btn) => {
      if ($(btn).text().toLowerCase().indexOf(v) >= 0) {
        $(btn).removeClass('d-none')
      } else {
        $(btn).addClass('d-none')
      }
    })
  })
})
