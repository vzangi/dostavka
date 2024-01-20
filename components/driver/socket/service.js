const BaseService = require('../../BaseService')
const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')
const OrderStatus = require('../../../models/OrderStatus')
const OrderPretendent = require('../../../models/OrderPretendent')
const { Op } = require('sequelize')
const { isoBetweenDates } = require('../../../unit/dateHelper')
const htmlspecialchars = require('htmlspecialchars')
const OrderManager = require('../../../unit/OrderManager')

class DriverSocketService extends BaseService {
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
					attributes: ['id', 'username', 'phone', 'tel', 'avatar'],
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
		await order.save()

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.ACCEPTED,
			`Курьер принял заказ`
		)

		const orderPretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId: driver.id,
			},
		})

		if (orderPretendent) {
			orderPretendent.status = OrderPretendent.statuses.ACCEPTED
			await orderPretendent.save()
		} else {
			await orderPretendent.create({
				orderId,
				driverId,
				status: OrderPretendent.statuses.ACCEPTED,
			})
		}

		await this._notifyDrivers(updatedOrder, 'order.accepted', [
			OrderPretendent.statuses.WHAITING,
			OrderPretendent.statuses.ACCEPTED,
		])

		const storeSockets = this.getUserSockets(updatedOrder.storeId, '/store')
		storeSockets.forEach((socket) => {
			socket.emit('order.update', updatedOrder)
		})

		return updatedOrder
	}

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

		order.driverId = null

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.WHAITING,
			`Курьер отказался от заказа по причине <b>${htmlspecialchars(reason)}</b>`
		)

		const pretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId: driver.id,
				status: OrderPretendent.statuses.ACCEPTED,
			},
		})

		if (pretendent) {
			pretendent.status = OrderPretendent.statuses.CANCELLED
			await pretendent.save()
		} else {
			await OrderPretendent.create({
				orderId,
				driverId: driver.id,
				status: OrderPretendent.statuses.CANCELLED,
			})
		}

		await this._notifyDrivers(updatedOrder, 'order.refused', [
			OrderPretendent.statuses.CANCELLED,
		])

		await OrderPretendent.destroy({
			where: {
				orderId,
				status: [OrderPretendent.statuses.WHAITING],
			},
		})

		const storeSockets = this.getUserSockets(updatedOrder.storeId, '/store')
		storeSockets.forEach((socket) => {
			socket.emit('order.update', updatedOrder)
		})

		OrderManager.startFounding(updatedOrder)

		return updatedOrder
	}

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
			throw new Error(`Нельзя выполнить от заказа #${orderId}`)
		}

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.DELIVERED,
			`Курьер доставил заказ`
		)

		await this._notifyDrivers(updatedOrder, 'order.complete', [
			OrderPretendent.statuses.ACCEPTED,
		])

		const storeSockets = this.getUserSockets(updatedOrder.storeId, '/store')
		storeSockets.forEach((socket) => {
			socket.emit('order.update', updatedOrder)
		})

		return updatedOrder
	}

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

	async cancelOrder(orderId, reason) {
		const order = await this.getOrderById(orderId)

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

		return await this._setNewStatus(order, Order.statuses.CANCELLED, comment)
	}

	async _setNewStatus(order, status, comment) {
		const { account, io } = this

		order.status = status
		await order.save()

		await OrderStatus.create({
			status,
			orderId: order.id,
			userId: account.id,
			comment,
		})

		const updatedOrder = await this.getOrderById(order.id)

		io.of('/admin').emit('order.update', updatedOrder)

		const driverSockets = this.getUserSockets(account.id, '/driver')
		driverSockets.forEach((driverSocket) => {
			driverSocket.emit('order.update', updatedOrder)
		})

		return updatedOrder
	}

	_getCurrentDriver() {
		const { account } = this

		if (!account) {
			throw new Error('Не авторизован')
		}

		if (account.role != User.roles.DRIVER) {
			throw new Error('Не курьер')
		}

		if (!account.active) {
			throw new Error('Аккаун заблокирован')
		}

		return account
	}

	async _notifyDrivers(order, eventName, status) {
		console.log(
			'Ищу курьеров, связанных с этим заказом и уведомляю о событии: ',
			eventName
		)
		// Ищу курьеров, связанных с этим заказом'
		const pretendents = await OrderPretendent.findAll({
			where: {
				orderId: order.id,
				status,
			},
		})

		console.log('Найдено курьеров: ', pretendents.length)

		for (const index in pretendents) {
			const pretendent = pretendents[index]
			console.log('Уведомляю курьера о событии: ', pretendent.driverId)
			const sockets = this.getUserSockets(pretendent.driverId, '/driver')
			sockets.forEach((socket) => {
				socket.emit(eventName, order)
			})
		}
	}
}

module.exports = DriverSocketService
