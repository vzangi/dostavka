class MainService {
	/**
	 * Данные для главной страницы сайта
	 */
	async main() {
		return {}
	}

	/**
	 * Данные для страницы контактов
	 */
	async contacts() {
		return {
			phone: '+79618238583',
			coolPhone: '+7 (961) 823-85-83',
			email: 'vzangi@yandex.ru',
			telegram: 'vzangi',
		}
	}
}

module.exports = MainService
