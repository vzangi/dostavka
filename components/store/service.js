const User = require('../../models/User')

class MainService {
	async main(account) {
		if (account.role != User.roles.STORE) {
			throw new Error('Вход в чужую зону')
		}
		const city = await account.getCity()
		const data = {
			city,
		}
		return data
	}
}

module.exports = MainService
