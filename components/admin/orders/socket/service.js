const BaseService = require('../../../BaseService')
const Order = require('../../../../models/Order')
const User = require('../../../../models/User')
const City = require('../../../../models/City')
const OrderStatus = require('../../../../models/OrderStatus')
const OrderPretendent = require('../../../../models/OrderPretendent')
const { Op } = require('sequelize')
const { isoDateFromString } = require('../../../../unit/dateHelper')
const htmlspecialchars = require('htmlspecialchars')
const OrderManager = require('../../../../unit/OrderManager')

class AdminOrderService extends BaseService {
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

		if (!store) {
			throw new Error('Магазин не найден')
		}

		if (store.role != User.roles.STORE) {
			throw new Error('Магазин не найден')
		}

		if (!store.active) {
			throw new Error('Магазин заблокирован')
		}

		orderData.cityId = store.cityId

		const order = await Order.create(orderData)

		let createComment = `Заказ создан администратором`
		createComment += `<br>Телефон: <b>${clientPhone}</b>`
		createComment += `<br>Адрес: <b>${address}</b>`
		if (summ) {
			createComment += `<br>Сумма: <b>${summ}</b>`
		}
		if (comment) {
			createComment += `<br>Комментарий: <b>${comment}</b>`
		}

		await OrderStatus.create({
			orderId: order.id,
			userId: this.account.id,
			comment: createComment,
		})

		// Отправляю заказ в менеджер
		await OrderManager.startFounding(order)

		this.io.of('/admin').emit('order.created', order)

		const storeSockets = this.getUserSockets(storeId, '/store')
		storeSockets.forEach((storeSocket) => {
			storeSocket.emit('order.created', order)
		})

		return order
	}

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

		const order = await this.getOrderById(id)

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

			this.io.of('/admin').emit('order.update', updatedOrder)

			const storeSockets = this.getUserSockets(updatedOrder.storeId, '/store')
			storeSockets.forEach((storeSocket) => {
				storeSocket.emit('order.update', updatedOrder)
			})

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

	async getOrderById(orderId) {
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

	async setDriver(orderId, driverId) {
		if (!driverId) {
			throw new Error('Не указан id курьера')
		}

		const order = await this.getOrderById(orderId)

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

		order.driverId = driverId

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.ACCEPTED,
			`Администратор назначил курьера вручную - ${driver.username}`
		)

		const orderPretendent = await OrderPretendent.findOne({
			where: {
				orderId,
				driverId,
			},
		})

		if (orderPretendent) {
			orderPretendent.status = OrderPretendent.statuses.ACCEPTED
			await orderPretendent.save()
		} else {
			OrderPretendent.create({
				orderId,
				driverId,
				status: OrderPretendent.statuses.ACCEPTED,
			})
		}

		await this._notifyDrivers(updatedOrder, 'order.accepted', [
			OrderPretendent.statuses.WHAITING,
			OrderPretendent.statuses.ACCEPTED,
		])

		return updatedOrder
	}

	async revertDriver(orderId, driverId) {
		const order = await this.getOrderById(orderId)

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

		OrderManager.startFounding(updatedOrder)

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

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.TAKED,
			'Администратор подтвердил, что курьер забрал заказ'
		)

		await this._notifyDrivers(updatedOrder, 'order.update', [
			OrderPretendent.statuses.ACCEPTED,
		])

		return updatedOrder
	}

	async cancelOrder(orderId, reason) {
		const order = await this.getOrderById(orderId)

		if (order.status == Order.statuses.CANCELLED) {
			throw new Error(`Заказ #${orderId} уже отменён`)
		}

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(`Заказ #${orderId} уже выполнен, его нельзя отменить`)
		}

		let comment = 'Администратор отменил заказа'
		if (reason)
			comment = comment + ` по причине: <b>${htmlspecialchars(reason)}</b>`

		const oldStatus = order.status

		const updateOrder = await this._setNewStatus(
			order,
			Order.statuses.CANCELLED,
			comment
		)

		// Если заказ был на ожидании
		if (oldStatus == Order.statuses.WHAITING) {
			// То надо уведомить всех курьеров,
			// которым было отправлено приглашение,
			// что заказ изменил статус

			await this._notifyDrivers(updateOrder, 'order.cancelled', [
				OrderPretendent.statuses.WHAITING,
				OrderPretendent.statuses.ACCEPTED,
			])
		} else {
			// Уведомляю водителя, что его заказ отменился
			await this._notifyDrivers(updateOrder, 'order.taked.cancelled', [
				OrderPretendent.statuses.ACCEPTED,
			])
		}

		return updateOrder
	}

	async completeOrder(orderId) {
		const order = await this.getOrderById(orderId)

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(`Заказ #${orderId} уже завершён`)
		}

		const updatedOrder = await this._setNewStatus(
			order,
			Order.statuses.DELIVERED,
			'Администратор подтвердил выполнение заказа'
		)

		await this._notifyDrivers(updatedOrder, 'order.complete', [
			OrderPretendent.statuses.ACCEPTED,
		])

		return updatedOrder
	}

	async rebootOrder(orderId) {
		const order = await this.getOrderById(orderId)

		if (
			order.status != Order.statuses.CANCELLED &&
			order.status != Order.statuses.DELIVERED
		) {
			throw new Error(`Заказ #${orderId} всё ещё в работе`)
		}

		const orderStatus = order.driverId
			? Order.statuses.ACCEPTED
			: Order.statuses.WHAITING

		return await this._setNewStatus(
			order,
			orderStatus,
			'Администратор вернул заказ в работу'
		)
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

		const storeSockets = this.getUserSockets(order.storeId, '/store')
		storeSockets.forEach((storeSocket) => {
			storeSocket.emit('order.update', updatedOrder)
		})

		return updatedOrder
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

module.exports = AdminOrderService
