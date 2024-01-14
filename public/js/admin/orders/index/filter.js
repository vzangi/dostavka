$(function () {
	const socket = io('/order')
	const orderTmpl = $('#orderTmpl')
	const noOrdersTmpl = $('#noOrdersTmpl')
	const badgeFilterTmpl = $('#badgeFilterTmpl')

	const ordersListBox = $('.order-list')
	const filterBtn = $('.btn-filter')
	const filterBox = $('.filter-box')
	const statusChecker = $('.status-checker')
	const btnStartFilter = $('.btn-start-filter')

	const citiesFilterBox = $('.cities')
	const btnCityChecker = $('.btn-city-check')
	const cityFilter = $('#cityFilter')

	const storesFilterBox = $('.stores')
	const btnStoreChecker = $('.btn-store-check')
	const storeFilter = $('#storeFilter')

	const driversFilterBox = $('.drivers')
	const btnDriverChecker = $('.btn-driver-check')
	const driverFilter = $('#driverFilter')

	// Запуск фильтрации заказов
	function filter() {
		const filterData = {}

		// Список выбранных статусов
		filterData.statuses = statusChecker
			.filter((_, sc) => $(sc).hasClass('checked'))
			.map((_, sc) => $(sc).data().id)
			.toArray()

		filterData.cities = citiesFilterBox
			.find('.city')
			.map((_, sc) => $(sc).data().id)
			.toArray()

		filterData.stores = storesFilterBox
			.find('.store')
			.map((_, st) => $(st).data().id)
			.toArray()

		filterData.drivers = driversFilterBox
			.find('.driver')
			.map((_, st) => $(st).data().id)
			.toArray()

		const phone = $('#client-phone').val()
		if (phone != '') {
			filterData.phone = phone
		}

		const address = $('#delivery-address').val()
		if (address != '') {
			filterData.address = address
		}

		const dateFrom = $('#date-from').val()
		if (dateFrom != '') {
			filterData.dateFrom = dateFrom
		}

		const dateTo = $('#date-to').val()
		if (dateTo != '') {
			filterData.dateTo = dateTo
		}

		// Получение списка заказов через сокет
		socket.emit('orders.get', filterData, (res) => {
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

	// Произошло обновление заказа
	socket.on('order.update', (order) => {
		// Если в таблице есть этот заказ - перезапускаем фильтр
		if ($(`tr[data-id=${order.id}]`).length == 1) filter()
	})

	// Запускаю фильтр если приходит новый заказ
	socket.on('order.created', (order) => {
		filter()
	})

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

	// Выбор города в модальной форме фильтра
	btnCityChecker.click(function () {
		const { id, name } = $(this).data()
		$(this).hide()
		badgeFilterTmpl.tmpl({ id, name, cls: 'city' }).prependTo(citiesFilterBox)
	})

	// Удаление города из списка фильтра
	citiesFilterBox.on('click', '.remove-city', function () {
		const { id } = $(this).parent().data()
		$(this).parent().remove()
		$(`.btn-city-check[data-id=${id}]`).show()
		$('.tooltip').remove()
	})

	// Фильтрация городов в модальном окне
	cityFilter.keyup(function () {
		const v = $(this).val().toLowerCase()

		btnCityChecker.each((_, btn) => {
			if ($(btn).text().toLowerCase().indexOf(v) >= 0) {
				$(btn).removeClass('d-none')
			} else {
				$(btn).addClass('d-none')
			}
		})
	})

	// Выбор магазина в модальной форме фильтра
	btnStoreChecker.click(function () {
		const { id, name } = $(this).data()
		$(this).hide()
		badgeFilterTmpl.tmpl({ id, name, cls: 'store' }).prependTo(storesFilterBox)
	})

	// Удаление магазина из списка фильтра
	storesFilterBox.on('click', '.remove-store', function () {
		const { id } = $(this).parent().data()
		$(this).parent().remove()
		$(`.btn-store-check[data-id=${id}]`).show()
		$('.tooltip').remove()
	})

	// Фильтрация магазинов в модальном окне
	storeFilter.keyup(function () {
		const v = $(this).val().toLowerCase()

		btnStoreChecker.each((_, btn) => {
			if ($(btn).text().toLowerCase().indexOf(v) >= 0) {
				$(btn).removeClass('d-none')
			} else {
				$(btn).addClass('d-none')
			}
		})
	})

	// Выбор курьера в модальной форме фильтра
	btnDriverChecker.click(function () {
		const { id, name } = $(this).data()
		$(this).hide()
		badgeFilterTmpl
			.tmpl({ id, name, cls: 'driver' })
			.prependTo(driversFilterBox)
	})

	// Удаление курьера из списка фильтра
	driversFilterBox.on('click', '.remove-driver', function () {
		const { id } = $(this).parent().data()
		$(this).parent().remove()
		$(`.btn-driver-check[data-id=${id}]`).show()
		$('.tooltip').remove()
	})

	// Фильтрация курьеров в модальном окне
	driverFilter.keyup(function () {
		const v = $(this).val().toLowerCase()

		btnDriverChecker.each((_, btn) => {
			if ($(btn).text().toLowerCase().indexOf(v) >= 0) {
				$(btn).removeClass('d-none')
			} else {
				$(btn).addClass('d-none')
			}
		})
	})

	// Выбор даты из календаря
	$('#date-from, #date-to').datepicker({
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
