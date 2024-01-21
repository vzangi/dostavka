const User = require('../../models/User')

class MainService {
	/**
	 *  Данные для главной страницы магазина
	 */
	async main(account) {
		const city = await account.getCity()
		const data = {
			city,
		}
		return data
	}
}

module.exports = MainService
