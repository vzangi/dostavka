$(function () {
	const filterBox = $('.filter-box')
	const filterBtn = $('.btn-filter')
	const btnStartFilter = $('.btn-start-filter')
	const statusChecker = $('.status-checker')
	const ordersListBox = $('.order-list')

	const orderTmpl = $('#orderTmpl')
	const noOrdersTmpl = $('#noOrdersTmpl')

	if ('localStorage' in window) {
		if (!localStorage.getItem('statusChecks')) {
			localStorage.setItem('statusChecks', '[1,2,3]')
		}

		const selectedChecks = JSON.parse(localStorage.getItem('statusChecks'))

		selectedChecks.forEach((sc) => {
			$(`.status-checker.status-${sc}`).addClass('checked')
		})
	}

	function filter() {
		const filterData = {}

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

	// Произошло обновление заказа
	socket.on('order.update', (order) => {
		// Если в таблице есть этот заказ - перезапускаем фильтр
		if ($(`tr[data-id=${order.id}]`).length == 1) filter()
	})

	socket.on('orders.new', (order) => {
		console.log('Новый заказ: ', order)
		filter()
	})

	socket.on('order.accepted', (order) => {
		console.log('Заказ был принят: ', order)
		filter()
	})

	socket.on('order.cancelled', (order) => {
		console.log('Заказ отменён: ', order)
		filter()
	})

	socket.on('order.complete', (order) => {
		console.log('Заказ выполнен: ', order)
		filter()
	})

	socket.on('order.taked', (order) => {
		console.log('Вы забрали заказ: ', order)
		filter()
	})

	socket.on('order.taked.cancelled', (order) => {
		console.log('Заказ который вы взяли отменён: ', order)
		filter()
	})

	socket.on('order.revert', (order) => {
		console.log('Администратор убрал вас из заказа: ', order)
		filter()
	})

	socket.on('order.refused', (order) => {
		console.log('Вы отказались от заказа: ', order)
		filter()
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

		if ('localStorage' in window) {
			const selectedChecks = $('.status-checker.checked')
				.map((_, sc) => {
					return $(sc).data().id
				})
				.toArray()

			localStorage.setItem('statusChecks', JSON.stringify(selectedChecks))
		}
	})

	$('.filter-box .input-group input').keyup(function () {
		if ($(this).val() != '') {
			$(this).parent().find('.clear-input').addClass('active')
		} else {
			$(this).parent().find('.clear-input').removeClass('active')
		}
	})

	$('.clear-input').click(function () {
		$(this).removeClass('active')
		$('.tooltip').remove()
		setTimeout(() => {
			$('.tooltip').remove()
		}, 100)
		$(this).parent().find('input').val('').focus()
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
		onSelect: function (date, datepicker) {
			if (date != '') {
				datepicker.input.next().addClass('active')
			} else {
				datepicker.input.next().removeClass('active')
			}
		},
	})
})
