const statuses = [
	{
		name: 'Ожидает',
		bgColorClass: 'warning',
	},
	{
		name: 'Принят',
		bgColorClass: 'primary',
	},
	{
		name: 'В пути',
		bgColorClass: 'info',
	},
	{
		name: 'Выполнен',
		bgColorClass: 'success',
	},
	{
		name: 'Отменён',
		bgColorClass: 'danger',
	},
]

const bsTooltips = () => {
	$('.tooltip').remove()
	;[].slice
		.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
		.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
}

const toDateString = (d) => new Date(d).toLocaleDateString('en-GB')

const today = () =>
	new Date(Date.now()).toLocaleDateString('en-GB').replaceAll('/', '.')

const tel = (phone) => {
	const p = phone
		.split('')
		.filter((d, i) => {
			if (i == 0 && d == '+') return true
			if ('0123456789'.indexOf(d) >= 0) return true
			return false
		})
		.join('')
	if (p[0] == '+') return p.substring(0, 12)
	return p.substring(0, 11)
}

$(function () {
	bsTooltips()
})
