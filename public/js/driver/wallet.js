$(function () {
	const walletInput = $(`input[name='wallet-summ']`)
	const payBtn = $('.btn-to-pay')
	const walletCnt = $('.driver-wallet').text() * 1

	if (walletCnt <= 0)
		alert(
			'На вашем балансе не хватает средств. Чтобы продолжить получать заказы - пополните его.'
		)

	payBtn.click(function () {
		const summ = walletInput.val().trim() * 1
		const min = walletInput.attr('min') * 1
		const max = walletInput.attr('max') * 1

		if (summ < min)
			return alert(`Сумма пополнения не может быть меньше ${min} рублей`)

		if (summ > max)
			return alert(`Сумма пополнения не может быть больше ${max} рублей`)

		alert(
			'Онлайн касса пока не подключена, но мы уже работаем над этим. Чтобы пополнить баланс обращайтесь к администратору.'
		)
	})
})
