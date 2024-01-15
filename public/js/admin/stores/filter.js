$(function () {
	const socket = io('/admin')

	const storeTmpl = $('#storeTmpl')
	const noStoresTmpl = $('#noStoresTmpl')
	const badgeFilterTmpl = $('#badgeFilterTmpl')

	const storesListBox = $('.stores-list')
	const filterBtn = $('.btn-filter')
	const filterBox = $('.filter-box')

	const citiesFilterBox = $('.cities')
	const btnCityChecker = $('.btn-city-check')
	const cityFilter = $('#cityFilter')

	const btnStartFilter = $('.btn-start-filter')

	// Запуск фильтрации курьеров
	function filter() {
		const filterData = {}

		filterData.cities = citiesFilterBox
			.find('.city')
			.map((_, sc) => $(sc).data().id)
			.toArray()

		filterData.actives = $('.actives .btn-check')
			.filter((_, bc) => bc.checked)
			.map((_, bc) => $(bc).data().value)
			.toArray()

		const phone = $('#phone').val()
		if (phone != '') {
			filterData.phone = phone
		}

		const name = $('#name').val()
		if (name != '') {
			filterData.name = name
		}

		// Получение списка магазинов через сокет
		socket.emit('stores.get', filterData, (res) => {
			const { status, msg } = res
			if (status != 0) return alert(msg)

			const { data } = res

			if (data.length == 0) {
				return noStoresTmpl.tmpl().appendTo(storesListBox.empty())
			}

			storeTmpl.tmpl(data).appendTo(storesListBox.empty())

			bsTooltips()
		})
	}

	// Клик на кнопке запуск фильтрации
	btnStartFilter.click(filter)

	// Открыть блок фильтра
	filterBtn.click(function () {
		filterBox.slideToggle()
	})

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
})
