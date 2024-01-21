const User = require('../models/User')

// Процедура проверяющая авторизован ли запрос
const isAuth = (req, res, next) => {
	const { user } = req
	if (user) return next()
	res.redirect('/login')
}

// Процедура проверяющая является ли пользователь администратором
const isAdmin = (req, res, next) => {
	const { account } = req
	if (!account) throw new Error('Не авторизован')
	if (account.role != User.roles.ADMIN) throw new Error('Не администратор')
	next()
}

// Процедура проверяющая является ли пользователь магазином
const isStore = (req, res, next) => {
	const { account } = req
	if (!account) throw new Error('Не авторизован')
	if (account.role != User.roles.STORE) throw new Error('Не магазин')
	next()
}

// Процедура проверяющая является ли пользователь курьером
const isDriver = (req, res, next) => {
	const { account } = req
	if (!account) throw new Error('Не авторизован')
	if (account.role != User.roles.DRIVER) throw new Error('Не курьер')
	next()
}

// Процедура добавляющая авторизованного пользователя
// в переменную user и account запроса
// и переменную currentAccount шаблонизатора
const userToTemplate = async (req, res, next) => {
	const { user } = req

	if (!user) {
		return next()
	}

	const account = await User.findOne({
		where: {
			id: user.id,
		},
	})

	req.account = account
	res.locals.currentAccount = account

	next()
}

// Процедура добавляющая авторизованного пользователя
// в переменную account сокета
const userToSocket = async (socket, next) => {
	const { user } = socket
	if (!user) return next()

	socket.account = await User.findOne({
		where: {
			id: user.id,
		},
	})

	next()
}

module.exports = {
	isAuth,
	isAdmin,
	isStore,
	isDriver,
	userToTemplate,
	userToSocket,
}
