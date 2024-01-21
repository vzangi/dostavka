const BaseController = require('../BaseController')
const Service = require('./service')
const { roles } = require('../../models/User')
const cookieTokenName = process.env.TOKEN_COOKIE || 'jwt'

// Время хранения токена авторизации
const maxAge = 1000 * 60 * 60 * 24 * 30 * 12 // год

class AuthController extends BaseController {
	/**
	 *  Отображение формы авторизации
	 */
	async loginPage(req, res) {
		try {
			const { account } = req

			// Если пользователь не авторизован
			// Отображаю страницу ввода логина и пароля
			if (!account) {
				return res.render('page/auth/login')
			}

			// Если авторизованный пользователь администратор
			// перевожу его на домашнюю страницу
			if (account.role == roles.ADMIN) {
				return res.redirect('/admin')
			}

			// Если авторизованный пользователь курьер
			// перевожу его на домашнюю страницу
			if (account.role == roles.DRIVER) {
				return res.redirect('/driver')
			}

			// Если авторизованный пользователь магазин
			// перевожу его на домашнюю страницу
			if (account.role == roles.STORE) {
				return res.redirect('/store')
			}
		} catch (error) {
			// В случае ошибки возвращю на главную страницу
			res.redirect('/')
		}
	}

	/**
	 * Авторизация
	 */
	async loginForm(req, res) {
		try {
			// Беру логин и проль из Post-запроса
			const { password, login } = req.body

			// Получаю access-токен
			const accessToken = await this.service.login(login, password)

			// Записываю токен в куки
			res.cookie(cookieTokenName, accessToken, { maxAge })

			// Перевожу запрос на форму авторизации,
			// чтобы перебросить пользователя на домашнюю страницу
			res.redirect('/login')
		} catch (error) {
			// В случае ошибки показываю форму авторизации
			// и прикрепляю сообщение
			res.render('page/auth/login', {
				message: error.message,
			})
		}
	}

	/**
	 * Выход с сайта
	 */
	async logout(req, res) {
		try {
			// Беру текущего пользователя из запроса
			const { account } = req

			// Выхожу с сайта
			await this.service.logout(account)

			// Очищаю куку с jwt-токеном
			res.clearCookie(cookieTokenName)

			// Перевожу пользователя на форму авторизации
			res.redirect('/login')
		} catch (error) {
			this.page404(res)
		}
	}

	/**
	 *  Процедура для создания первого администратора
	 */
	async makeAdmin(req, res) {
		try {
			// Получаю пароль администратора из query-параметров
			const { pass } = req.params

			// Создаю администратора
			await this.service.makeAdmin(pass)

			// Перебрасываю пользователя на страницу авторизации
			res.redirect('/login')
		} catch (error) {
			this.page404(res)
		}
	}
}

module.exports = new AuthController(Service)
