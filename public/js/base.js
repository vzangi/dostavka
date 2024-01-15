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
	;[].slice
		.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
		.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
}

const toDateString = (d) => new Date(d).toLocaleDateString('en-GB')

$(function () {
	bsTooltips()
})
