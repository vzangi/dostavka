const { hash, compare } = require('bcrypt')
const { createToken } = require('../../unit/jwt')
const User = require('../../models/User')
const saltNumber = 10

class AuthService {
	/**
	 *  Процедура авторизации
	 */
	async login(login, password) {
		if (!login || !password) {
			throw new Error('Нет необходимых данных')
		}

		// Ищу пользователя в базе по логину
		const user = await User.findOne({
			where: { login },
		})

		//Если не найден - выхожу
		if (!user) {
			throw new Error('Неверный логин или пароль')
		}

		// Если заблокирован - выхожу
		if (!user.active) {
			throw new Error('Пользователь заблокирован')
		}

		// Проверяю пароль
		const match = await compare(password, user.password)

		// Если не совпал - выхожу
		if (!match) {
			throw new Error('Неверный логин или пароль')
		}

		// Создаю токен авторизации
		const accessToken = createToken(user)

		// Указываю, что пользователь начал работу
		user.online = true
		await user.save()

		return accessToken
	}

	/**
	 * Выход с сайта
	 */
	async logout(account) {
		if (!account) {
			throw new Error('Не авторизован')
		}

		// Ставлю маркер, что пользователь вышел
		account.online = false
		await account.save()
	}

	/**
	 * Создание администратора
	 */
	async makeAdmin(pass) {
		if (!pass) {
			throw new Error('Нет необходимых данных')
		}

		// Пароль должен совпадать с тем,
		// который записан в фале конфигурации .env
		if (pass != process.env.ADMIN_PASS) {
			throw new Error('Неверный пароль')
		}

		// Логин администратора
		const username = 'admin'

		// Проверка на наличие администратора в базе
		const hasAdmin = await User.findOne({
			where: { username },
		})

		if (hasAdmin) {
			throw new Error('Админ уже создан')
		}

		// Получаю хэш пароля
		const password = await hash(pass, saltNumber)

		// Создаю администратора в базе
		await User.create({
			username,
			login: username,
			password,
			role: User.roles.ADMIN,
		})
	}
}

module.exports = AuthService
