const City = require('../models/City')
const Order = require('../models/Order')
const OrderPretendent = require('../models/OrderPretendent')
const OrderStatus = require('../models/OrderStatus')
const User = require('../models/User')
const OrderManager = require('../unit/OrderManager')
const BaseService = require('./BaseService')

class UserSocketService extends BaseService {
	/**
	 * Получение текущего пользователя
	 */
	_getCurrentUser(role) {
		const { account } = this

		if (!account) {
			throw new Error('Не авторизован')
		}

		if (account.role != role) {
			throw new Error('Не верная роль пользователя')
		}

		if (!account.active) {
			throw new Error('Аккаун заблокирован')
		}

		return account
	}

	/**
	 * Получение заказа по номеру
	 */
	async _getOrderById(orderId) {
		if (!orderId) {
			throw new Error('Не указан id заказа')
		}

		const order = await Order.findByPk(orderId, {
			include: [
				{
					model: City,
				},
				{
					model: User,
					as: 'store',
					attributes: ['id', 'username', 'address', 'phone', 'tel', 'avatar'],
				},
				{
					model: User,
					as: 'driver',
					attributes: ['id', 'username', 'address', 'phone', 'tel', 'avatar'],
				},
				{
					model: OrderStatus,
					include: [
						{
							model: User,
							attributes: ['id', 'username'],
						},
					],
				},
			],
		})

		if (!order) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		return order
	}

	async getOrder(orderId) {
		return await this._getOrderById(orderId)
	}

	/**
	 * Установка нового статуса заказа
	 */
	async _setNewStatus(order, status, comment) {
		const { account, io } = this

		// Меняю статус заказа
		order.status = status
		await order.save()

		// Записываю новый статус
		// и комментарий к нему в лог статусов
		await OrderStatus.create({
			status,
			orderId: order.id,
			userId: account.id,
			comment,
		})

		// Получаю обновлённый заказ
		const updatedOrder = await this.getOrder(order.id)

		// Сообщаю администратору об изменениях
		io.of('/admin').emit('order.update', updatedOrder)

		// Сообщаю магазину об изменениях
		const storeSockets = this.getUserSockets(updatedOrder.storeId, '/store')
		storeSockets.forEach((socket) => {
			socket.emit('order.update', updatedOrder)
		})

		// Если к заказу привязан курьер
		if (updatedOrder.driverId) {
			// Сообщаю ему об изменениях
			const driverSockets = this.getUserSockets(
				updatedOrder.driverId,
				'/driver'
			)
			driverSockets.forEach((socket) => {
				socket.emit('order.update', updatedOrder)
			})
		}

		return updatedOrder
	}

	/**
	 * Уведомление курьеров о событии
	 */
	async _notifyDrivers(order, eventName, status) {
		// Ищу курьеров, связанных с этим заказом'
		const pretendents = await OrderPretendent.findAll({
			where: {
				orderId: order.id,
				status,
			},
		})

		for (const index in pretendents) {
			const pretendent = pretendents[index]
			const sockets = this.getUserSockets(pretendent.driverId, '/driver')
			sockets.forEach((socket) => {
				socket.emit(eventName, order)
			})
		}
	}

	/**
	 * Создание заказа
	 */
	async createOrder(orderData) {
		const {
			clientPhone,
			summ,
			storeId,
			address,
			latitude,
			longitude,
			comment,
		} = orderData

		if (!clientPhone || !storeId || !address) {
			throw new Error('Нет необходимых данных')
		}

		if (latitude == '') {
			delete orderData.latitude
		}

		if (longitude == '') {
			delete orderData.longitude
		}

		const store = await User.findByPk(storeId)

		if (!store || store.role != User.roles.STORE) {
			throw new Error('Магазин не найден')
		}

		if (!store.active) {
			throw new Error('Магазин заблокирован')
		}

		// Ставлю город магазина городом заказа
		orderData.cityId = store.cityId

		// Сохраняю заказ в базе
		const order = await Order.create(orderData)

		let createComment = `Заказ создан`
		createComment += `<br>Телефон: <b>${clientPhone}</b>`
		createComment += `<br>Адрес: <b>${address}</b>`
		if (summ) {
			createComment += `<br>Сумма: <b>${summ}</b>`
		}
		if (comment) {
			createComment += `<br>Комментарий: <b>${comment}</b>`
		}

		// Логирую первоначальный статус заказа
		await OrderStatus.create({
			orderId: order.id,
			userId: this.account.id,
			comment: createComment,
		})

		// Запускаю поиск курьера при помощи менеджера заказов
		await OrderManager.startFounding(order)

		// Уведомляю администратора о новом заказе
		this.io.of('/admin').emit('order.created', order)

		// Уведомляю магазин о новом заказе
		const storeSockets = this.getUserSockets(storeId, '/store')
		storeSockets.forEach((storeSocket) => {
			storeSocket.emit('order.created', order)
		})

		return order
	}

	/**
	 * Изменение данных заказа
	 */
	async updateOrder(orderData) {
		const { id, clientPhone, summ, address, latitude, longitude, comment } =
			orderData

		if (!id || !clientPhone || !address) {
			throw new Error('Нет необходимых данных')
		}

		if (latitude == '') {
			delete orderData.latitude
		}

		if (longitude == '') {
			delete orderData.longitude
		}

		const order = await this.getOrder(id)

		const changes = []

		if (order.clientPhone != clientPhone) {
			order.clientPhone = clientPhone
			changes.push(`Изменён номер клиента: <b>${clientPhone}</b>`)
		}

		if (order.summ != summ) {
			order.summ = summ
			changes.push(`Изменена сумма заказа: <b>${summ}</b>`)
		}

		if (order.address != address) {
			order.address = address
			changes.push(`Изменён адрес: <b>${address}</b>`)
			if (orderData.latitude) order.latitude = orderData.latitude
			if (orderData.longitude) order.longitude = orderData.longitude
		}

		if (order.comment != comment) {
			order.comment = comment
			changes.push(`Изменён комментарий: <b>${comment}</b>`)
		}

		if (changes.length > 0) {
			const changesMessage = changes.join('<br>')
			const updatedOrder = await this._setNewStatus(
				order,
				order.status,
				changesMessage
			)

			// Статусы курьеров связанных с заказом
			const statuses = [OrderPretendent.statuses.ACCEPTED]

			// Если заказ ещё не взят, то добавляю также ожидающих курьеров
			if (updatedOrder.status == Order.statuses.WHAITING) {
				statuses.push(OrderPretendent.statuses.WHAITING)
			}

			// Уведомляю курьеров об изменении заказа
			this._notifyDrivers(updatedOrder, 'order.update', statuses)

			return updatedOrder
		}

		return order
	}

	/**
	 * Получение ссылки для подключения
	 * уведомлений в телеграм
	 */
	async getTelegramLink() {
		const { account } = this

		if (!account) {
			throw new Error('Не авторизован')
		}

		const botName = process.env.TELEGRAM_BOT_NAME

		const link = `https://t.me/${botName}?start=${account.id}__${account.id}3301`

		return { link }
	}
}

module.exports = UserSocketService
