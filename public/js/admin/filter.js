$(function () {

	const filterInput = $('#filter')

	filterInput.keyup(function () {
		const v = $(this).val()

		const lines = $('tbody tr')

		lines.each((i, line) => {
			const cells = $(line).find('td[data-val]')

			const finded = cells.filter((_, c) => {
				const { val } = $(c).data()
				const has = val.toLowerCase().indexOf(v.toLowerCase()) >= 0

				if (has) {
					$(c).html(val.replace(v, `<i>${v}</i>`))
				}

				return has
			})

			if (finded.length > 0) {
				$(line).show()
			} else {
				$(line).hide()
			}
		})
	})

})