const UserSocketService = require('../../UserSocketService')
const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')
const OrderStatus = require('../../../models/OrderStatus')
const OrderPretendent = require('../../../models/OrderPretendent')
const { Op } = require('sequelize')
const { isoBetweenDates } = require('../../../unit/dateHelper')
const htmlspecialchars = require('htmlspecialchars')
const OrderManager = require('../../../unit/OrderManager')
const deliveryPrice = 4

class DriverSocketService extends UserSocketService {
	/**
	 * Получение текущего курьера
	 */
	_getCurrentDriver() {
		return this._getCurrentUser(User.roles.DRIVER)
	}

	/**
	 * Получение отфильтрованного списка заказов
	 */
	async getOrders(filter) {
		const driver = this._getCurrentDriver()

		if (!filter) {
			throw new Error('Не указан фильтр')
		}

		const { statuses, address, dateFrom } = filter
		const where = {}

		where.driverId = driver.id

		if (statuses && statuses.length > 0) where.status = statuses

		if (address && address != '') {
			where.address = {
				[Op.substring]: address,
			}
		}

		if (dateFrom && dateFrom != '') {
			where.createdAt = {
				[Op.between]: isoBetweenDates(dateFrom),
			}
		}

		// Получение заказов, в которых участвует курьер
		const orders = await Order.findAll({
			where,
			order: [['id', 'desc']],
			include: [
				{
					model: User,
					as: 'store',
					attributes: ['username', 'address', 'phone'],
				},
				{
					model: User,
					as: 'driver',
					attributes: ['username', 'phone', 'address'],
				},
				{
					model: City,
				},
			],
		})

		delete where.driverId
		where.status = Order.statuses.WHAITING

		// Получение новых заказов, в которых курьер может поучаствовать
		const whaitingOrders = await Order.findAll({
			where,
			order: [['id', 'desc']],
			include: [
				{
					model: User,
					as: 'store',
					attributes: ['username', 'address', 'phone'],
				},
				{
					model: User,
					as: 'driver',
					attributes: ['username', 'phone', 'address'],
				},
				{
					model: City,
				},
				{
					model: OrderPretendent,
					where: {
						driverId: driver.id,
						status: [
							OrderPretendent.statuses.WHAITING,
							OrderPretendent.statuses.ACCEPTED,
						],
					},
				},
			],
		})

		// Сращиваю заказы
		const fullOrders = orders.concat(whaitingOrders)

		// Сортирую по дате
		fullOrders.sort((a, b) =>
			a.createdAt === b.createdAt ? 0 : a.createdAt < b.createdAt ? 1 : -1
		)

		return fullOrders
	}

	/**
	 * Получение заказа по номеру
	 */
	async getOrderById(orderId) {
		const driver = this._getCurrentDriver()

		const order = await Order.findByPk(orderId, {
			include: [
				{
					model: City,
				},
				{
					model: User,
					as: 'driver',
					where: {
						id: driver.id,
						role: User.roles.DRIVER,
					},
					required: false,
					attributes: ['id', 'username', 'address', 'phone', 'tel', 'avatar'],
				},
				{
					model: User,
					as: 'store',
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

	/**
	 * Взять заказ в работу
	 */
	async acceptOrder(orderId) {
		const driver = this._getCurrentDriver()

		const order = await Order.findByPk(orderId)

		if (order.driverId) {
			throw new Error(`Заказу #${orderId} уже назначен курьер`)
		}

		if (order.status != Order.statuses.WHAITING) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		order.driverId = driver.id

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.ACCEPTED,
			`Курьер принял заказ`
		)

		// Ищу курьера среди претендентов на заказ
		const orderPretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId: driver.id,
			},
		})

		// Если курьер найден
		if (orderPretendent) {
			// Обновляю статус на "Взял заказ"
			orderPretendent.status = OrderPretendent.statuses.ACCEPTED
			await orderPretendent.save()
		} else {
			// Если нет - создаю в базе новую запись
			await orderPretendent.create({
				orderId,
				driverId,
				status: OrderPretendent.statuses.ACCEPTED,
			})
		}

		// Уведомляю курьеров об изменении статуса заказа
		await this._notifyDrivers(updatedOrder, 'order.accepted', [
			OrderPretendent.statuses.WHAITING,
		])

		return updatedOrder
	}

	/**
	 * Отказаться от заказа
	 */
	async refuseOrder(orderId, reason) {
		const driver = this._getCurrentDriver()

		const order = await Order.findByPk(orderId)

		if (!order) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		if (order.driverId != driver.id) {
			throw new Error(`Вы не являетесь исполнителем заказа #${orderId}`)
		}

		if (
			order.status != Order.statuses.ACCEPTED &&
			order.status != Order.statuses.TAKED
		) {
			throw new Error(`Нельзя отказаться от заказа #${orderId}`)
		}

		// Убираю курьера из заказа
		order.driverId = null

		let comment = 'Курьер отказался от заказа'
		if (reason) {
			comment += ` по причине: <b>${htmlspecialchars(reason)}</b>`
		}

		// Обновляю статус заказа
		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.WHAITING,
			comment
		)

		// Ищу курьера в списке претендентов
		const pretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId: driver.id,
				status: OrderPretendent.statuses.ACCEPTED,
			},
		})

		// Если он там был
		if (pretendent) {
			// Ставлю ему статус на "Отказался"
			pretendent.status = OrderPretendent.statuses.CANCELLED
			await pretendent.save()
		} else {
			// Если нет - создаю запись
			await OrderPretendent.create({
				orderId,
				driverId: driver.id,
				status: OrderPretendent.statuses.CANCELLED,
			})
		}

		// Уведомляю его об изменении статуса
		await this._notifyDrivers(updatedOrder, 'order.refused', [
			OrderPretendent.statuses.CANCELLED,
		])

		// Удаляю приглашения разосланные ранее
		await OrderPretendent.destroy({
			where: {
				orderId,
				status: [OrderPretendent.statuses.WHAITING],
			},
		})

		// Запускаю процедуру поиска курьера
		OrderManager.startFounding(updatedOrder)

		return updatedOrder
	}

	/**
	 * Вернуть заказ в магазин
	 */
	async revertOrder(orderId, reason) {
		const driver = this._getCurrentDriver()

		const order = await Order.findByPk(orderId)

		if (!order) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		if (order.driverId != driver.id) {
			throw new Error(`Вы не являетесь исполнителем заказа #${orderId}`)
		}

		if (order.status != Order.statuses.TAKED) {
			throw new Error(`Нельзя вернуть заказ #${orderId}`)
		}

		let comment = 'Курьер вернул заказ'
		if (reason) {
			comment += ` по причине: <b>${htmlspecialchars(reason)}</b>`
		}

		// Обновляю статус заказа
		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.ACCEPTED,
			comment
		)

		return updatedOrder
	}

	/**
	 * Выполнить заказ
	 */
	async completeOrder(orderId) {
		const driver = this._getCurrentDriver()

		const order = await Order.findByPk(orderId)

		if (!order) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		if (order.driverId != driver.id) {
			throw new Error(`Вы не являетесь исполнителем заказа #${orderId}`)
		}

		if (
			order.status != Order.statuses.ACCEPTED &&
			order.status != Order.statuses.TAKED
		) {
			throw new Error(`Нельзя выполнить заказ #${orderId}`)
		}

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.DELIVERED,
			`Курьер доставил заказ`
		)

		// Списываю у курьера плату за заказ
		driver.wallet -= deliveryPrice
		await driver.save()

		this._notifyDrivers(updatedOrder, 'order.complete', [
			OrderPretendent.statuses.ACCEPTED,
		])

		return updatedOrder
	}

	/**
	 * Подтверждение, что курьер забрал заказ
	 */
	async takedOrder(orderId) {
		const order = await this.getOrderById(orderId)

		if (order.status != Order.statuses.ACCEPTED) {
			throw new Error(`Заказ #${orderId} не подтверждён`)
		}

		if (!order.driverId) {
			throw new Error(`Заказу #${orderId} не назначен курьер`)
		}

		return await this._setNewStatus(
			order,
			Order.statuses.TAKED,
			'Курьер забрал заказ'
		)
	}

	/**
	 * Получение баланса
	 */
	async getWallet() {
		const driver = this._getCurrentDriver()
		const walletData = await User.findByPk(driver.id)
		if (!walletData) {
			throw new Error('Не удалось получить данные баланса')
		}
		return {
			wallet: walletData.wallet,
		}
	}
}

module.exports = DriverSocketService
