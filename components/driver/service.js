const User = require('../../models/User')

class MainService {
	async main(account) {
		if (account.role != User.roles.DRIVER) {
			throw new Error('Вход в чужую зону')
		}
		return {}
	}
}

module.exports = MainService
