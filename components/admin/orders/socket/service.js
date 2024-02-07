const htmlspecialchars = require('htmlspecialchars')
const { Op } = require('sequelize')
const { isoDateFromString } = require('../../../../unit/dateHelper')
const OrderManager = require('../../../../unit/OrderManager')
const Order = require('../../../../models/Order')
const User = require('../../../../models/User')
const City = require('../../../../models/City')
const OrderPretendent = require('../../../../models/OrderPretendent')
const UserSocketService = require('../../../UserSocketService')
const bot = require('../../../../unit/bot')
const deliveryPrice = 4

class AdminOrderService extends UserSocketService {
	/**
	 * Получение данных заказа по номеру
	 */
	async getOrder(orderId) {
		const order = await this._getOrderById(orderId)

		// Если заказ в поиске курьера - включаю в него данные претендентов
		if (order.status == Order.statuses.WHAITING) {
			const pretendents = await OrderPretendent.findAll({
				where: {
					orderId,
					status: [
						OrderPretendent.statuses.WHAITING,
						OrderPretendent.statuses.CANCELLED,
					],
				},
				include: [
					{
						model: User,
						as: 'driver',
						attributes: ['id', 'username', 'phone', 'avatar', 'address'],
					},
				],
			})

			order.dataValues.pretendents = pretendents
		}

		return order
	}

	/**
	 * Получение отфильтрованного списка заказов
	 */
	async getOrders(filter) {
		if (!filter) {
			throw new Error('Не указан фильтр')
		}

		const {
			statuses,
			cities,
			phone,
			address,
			stores,
			drivers,
			dateFrom,
			dateTo,
		} = filter
		const where = {}

		if (statuses && statuses.length > 0) where.status = statuses

		if (cities && cities.length > 0) where.cityId = cities

		if (stores && stores.length > 0) where.storeId = stores

		if (drivers && drivers.length > 0) where.driverId = drivers

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
				[Op.gte]: isoDateFromString(dateFrom),
			}
		}

		if (dateTo && dateTo != '') {
			where.createdAt = {
				[Op.lte]: isoDateFromString(dateTo, true),
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
					attributes: ['username', 'phone'],
				},
				{
					model: City,
				},
			],
		})

		return orders
	}

	/**
	 * Назначение курьера для заказа вручную
	 */
	async setDriver(orderId, driverId) {
		if (!driverId) {
			throw new Error('Не указан id курьера')
		}

		const order = await this.getOrder(orderId)

		if (order.driverId) {
			throw new Error(`Заказу #${orderId} уже назначен курьер`)
		}

		if (order.status == Order.statuses.CANCELLED) {
			throw new Error(
				`Заказ #${orderId} был отменён. Невозможно назначить для него курьера`
			)
		}

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(
				`Заказ #${orderId} был выполнен. Невозможно назначить для него курьера`
			)
		}

		const driver = await User.findByPk(driverId, {
			attributes: ['id', 'username', 'phone', 'tel', 'active', 'online'],
		})

		if (!driver) {
			throw new Error(`Курьер #${driverId} не найден`)
		}

		if (!driver.active) {
			throw new Error(
				`Курьер #${driver.username} заблокирован и не может быть назначен для выполнения заказа`
			)
		}

		if (!driver.online) {
			throw new Error(`Курьер #${driver.username} в данный момент не работает`)
		}

		// Назначаю курьера на заказ
		order.driverId = driverId

		// Обновляю статус
		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.ACCEPTED,
			`Администратор назначил курьера вручную - ${driver.username}`
		)

		// Ищу курьера среди претендентов на заказ
		const orderPretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId,
			},
		})

		// Если курьер найден
		if (orderPretendent) {
			// Обновляю статус на "Взял заказ"
			orderPretendent.status = OrderPretendent.statuses.ACCEPTED
			await orderPretendent.save()
		} else {
			// Если нет - создаю в базе новую запись
			OrderPretendent.create({
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
	 * Снять курьера с заказа вручную
	 */
	async revertDriver(orderId, driverId) {
		const order = await this.getOrder(orderId)

		if (!order.driverId) {
			throw new Error(`Заказу #${orderId} не был назначен курьер`)
		}

		if (order.driverId != driverId) {
			throw new Error(`Заказу #${orderId} был назначен другой курьер`)
		}

		order.driverId = null

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.WHAITING,
			'Курьер снят с заказа администратором'
		)

		await OrderPretendent.destroy({
			where: {
				orderId,
				status: OrderPretendent.statuses.WHAITING,
			},
		})

		await this._notifyDrivers(updatedOrder, 'order.revert', [
			OrderPretendent.statuses.ACCEPTED,
		])

		const pretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId,
				status: OrderPretendent.statuses.ACCEPTED,
			},
		})

		if (pretendent) {
			pretendent.status = OrderPretendent.statuses.CANCELLED
			await pretendent.save()
		}

		// Запускаю поиск курьера для заказа
		OrderManager.startFounding(updatedOrder)

		return updatedOrder
	}

	/**
	 * Подтверждение, что курьер забрал заказ
	 */
	async takedOrder(orderId) {
		const order = await this.getOrder(orderId)

		if (order.status != Order.statuses.ACCEPTED) {
			throw new Error(`Заказ #${orderId} не подтверждён`)
		}

		if (!order.driverId) {
			throw new Error(`Заказу #${orderId} не назначен курьер`)
		}

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.TAKED,
			'Администратор подтвердил, что курьер забрал заказ'
		)

		return updatedOrder
	}

	/**
	 * Отмена заказа
	 */
	async cancelOrder(orderId, reason) {
		const order = await this.getOrder(orderId)

		if (order.status == Order.statuses.CANCELLED) {
			throw new Error(`Заказ #${orderId} уже отменён`)
		}

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(`Заказ #${orderId} уже выполнен, его нельзя отменить`)
		}

		let comment = 'Администратор отменил заказа'
		if (reason)
			comment = comment + ` по причине: <b>${htmlspecialchars(reason)}</b>`

		// Статус который был до отмены
		const oldStatus = order.status

		// Обновляю статус
		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.CANCELLED,
			comment
		)

		// Если заказ был на ожидании
		if (oldStatus == Order.statuses.WHAITING) {
			// То надо уведомить всех курьеров,
			// которым было отправлено приглашение,
			// что заказ отменён

			await this._notifyDrivers(updatedOrder, 'order.cancelled', [
				OrderPretendent.statuses.WHAITING,
			])
		} else {
			// Заказ выполняется курьером, надо уведомить его о том что заказ отменён

			// Если курьер привязал тг, то уведомляю его и там
			const driver = await User.findByPk(updatedOrder.driverId)
			if (driver && driver.telegramChatId) {
				let msg = `Заказ №${updatedOrder.id} отменён администратором`
				if (reason)
					msg = msg + ` по причине: <b>${htmlspecialchars(reason)}</b>`
				bot.sendMessage(driver.telegramChatId, msg, { parse_mode: 'HTML' })
			}
		}

		return updatedOrder
	}

	/**
	 * Выполнить заказ
	 */
	async completeOrder(orderId) {
		const order = await this.getOrder(orderId)

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(`Заказ #${orderId} уже завершён`)
		}

		// Обновляю статус заказа
		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.DELIVERED,
			'Администратор подтвердил выполнение заказа'
		)

		const driver = await User.findByPk(order.driverId)

		// Списываю у курьера плату за заказ
		driver.wallet -= deliveryPrice
		await driver.save()

		this._notifyDrivers(updatedOrder, 'order.complete', [
			OrderPretendent.statuses.ACCEPTED,
		])

		return updatedOrder
	}

	/**
	 * Вернуть заказ в работу
	 */
	async rebootOrder(orderId) {
		const order = await this.getOrder(orderId)

		if (
			order.status != Order.statuses.CANCELLED &&
			order.status != Order.statuses.DELIVERED
		) {
			throw new Error(`Заказ #${orderId} всё ещё в работе`)
		}

		// Статус заказа в зависимости от наличия в нем курьера
		const orderStatus = order.driverId
			? Order.statuses.ACCEPTED
			: Order.statuses.WHAITING

		const updatedOrder = await this._setNewStatus(
			order,
			orderStatus,
			'Администратор вернул заказ в работу'
		)

		// Если заказ в ожидании
		if (orderStatus == Order.statuses.WHAITING) {
			// Удаляю ранее отправленные предложения взять заказ
			await OrderPretendent.destroy({
				where: {
					orderId: updatedOrder.id,
					status: OrderPretendent.statuses.WHAITING,
				},
			})

			// Запускаю поиск курьера для заказа
			OrderManager.startFounding(updatedOrder)
		}

		return updatedOrder
	}
}

module.exports = AdminOrderService
