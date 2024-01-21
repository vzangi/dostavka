const UserSocketService = require('../../UserSocketService')
const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')
const OrderStatus = require('../../../models/OrderStatus')
const { Op } = require('sequelize')
const { isoBetweenDates } = require('../../../unit/dateHelper')
const htmlspecialchars = require('htmlspecialchars')
const OrderManager = require('../../../unit/OrderManager')

class StoreSocketService extends UserSocketService {
	/**
	 * Получение текущего магазина
	 */
	_getCurrentStore() {
		return this._getCurrentUser(User.roles.STORE)
	}

	/**
	 * Получение отфильтрованного списка заказов
	 */
	async getOrders(filter) {
		const store = this._getCurrentStore()

		if (!filter) {
			throw new Error('Не указан фильтр')
		}

		const { statuses, phone, address, dateFrom } = filter
		const where = {}

		where.storeId = store.id

		if (statuses && statuses.length > 0) where.status = statuses

		if (phone && phone != '') {
			where.clientPhone = {
				[Op.substring]: phone,
			}
		}

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

		return orders
	}

	/**
	 * Получение заказа по номеру
	 */
	async getOrder(orderId) {
		// Беру заказ
		const order = await this._getOrderById(orderId)

		// Текущий магазин
		const store = this._getCurrentStore()

		// Если заказ не из этого магазина - генерирую ошибку
		if (order.storeId != store.id) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		return order
	}

	/**
	 * Создание заказа
	 */
	async createOrder(orderData) {
		const store = this._getCurrentStore()

		orderData.storeId = store.id

		const newOrder = await super.createOrder(orderData)

		return newOrder
	}

	/**
	 * Установка статуса указывающего, что курьер забрал заказ
	 */
	async takedOrder(orderId) {
		const order = await this.getOrder(orderId)

		if (order.status != Order.statuses.ACCEPTED) {
			throw new Error(`Заказ #${orderId} не подтверждён`)
		}

		if (!order.driverId) {
			throw new Error(`Заказу #${orderId} не назначен курьер`)
		}

		// Меняю статус
		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.TAKED,
			'Курьер забрал заказ'
		)

		return updatedOrder
	}

	/**
	 * Отмена заказа с указанием причины
	 */
	async cancelOrder(orderId, reason) {
		const order = await this.getOrder(orderId)

		if (order.status == Order.statuses.CANCELLED) {
			throw new Error(`Заказ #${orderId} уже отменён`)
		}

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(`Заказ #${orderId} уже доставлен, его нельзя отменить`)
		}

		if (order.status == Order.statuses.TAKED) {
			throw new Error(
				`Заказ #${orderId} забрал курьер, сначала он должен его вернуть`
			)
		}

		let comment = 'Магазин отменил заказ'
		if (reason)
			comment = comment + ` по причине: <b>${htmlspecialchars(reason)}</b>`

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.CANCELLED,
			comment
		)

		if (updatedOrder.driverId) {
			const driverSockets = this.getUserSockets(
				updatedOrder.driverId,
				'/driver'
			)
			driverSockets.forEach((socket) => {
				socket.emit('order.cancelled', updatedOrder)
			})
		}

		return updatedOrder
	}
}

module.exports = StoreSocketService
