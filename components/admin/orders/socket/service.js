const BaseService = require('../../../BaseService')
const Order = require('../../../../models/Order')
const User = require('../../../../models/User')
const City = require('../../../../models/City')
const { Op } = require('sequelize')
const { isoDateFromString } = require('../../../../unit/dateHelper')

class AdminOrderService extends BaseService {
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
			order: [['updatedAt', 'desc']],
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

	async setDriver(orderId, driverId) {
		if (!driverId) {
			throw new Error('Не указан id курьера')
		}

		const order = await this._getOrderById(orderId)

		if (order.driverId) {
			throw new Error(`Заказу #${orderId} уже назначен курьер`)
		}

		const driver = await User.findByPk(driverId, {
			attributes: ['id', 'username', 'phone', 'tel'],
		})

		if (!driver) {
			throw new Error(`Курьер #${driverId} не найден`)
		}

		order.driverId = driverId
		order.status = Order.statuses.ACCEPTED
		await order.save()

		order.dataValues.driver = driver

		this.io.of('/order').emit('order.update', order)

		return order
	}

	async revertDriver(orderId, driverId) {
		const order = await this._getOrderById(orderId)

		if (!order.driverId) {
			throw new Error(`Заказу #${orderId} не был назначен курьер`)
		}

		if (order.driverId != driverId) {
			throw new Error(`Заказу #${orderId} был назначен другой курьер`)
		}

		order.driverId = null
		order.status = Order.statuses.WHAITING
		await order.save()

		order.dataValues.driver = null

		this.io.of('/order').emit('order.update', order)

		return order
	}

	async takedOrder(orderId) {
		const order = await this._getOrderById(orderId)

		if (order.status != Order.statuses.ACCEPTED) {
			throw new Error(`Заказ #${orderId} не подтверждён`)
		}

		if (!order.driverId) {
			throw new Error(`Заказу #${orderId} не назначен курьер`)
		}

		order.status = Order.statuses.TAKED
		await order.save()

		this.io.of('/order').emit('order.update', order)

		return order
	}

	async cancelOrder(orderId) {
		const order = await this._getOrderById(orderId)

		if (order.status == Order.statuses.CANCELLED) {
			throw new Error(`Заказ #${orderId} уже отменён`)
		}

		order.status = Order.statuses.CANCELLED
		await order.save()

		this.io.of('/order').emit('order.update', order)

		return order
	}

	async completeOrder(orderId) {
		const order = await this._getOrderById(orderId)

		if (order.status == Order.statuses.DELIVERED) {
			throw new Error(`Заказ #${orderId} уже завершён`)
		}

		order.status = Order.statuses.DELIVERED
		await order.save()

		this.io.of('/order').emit('order.update', order)

		return order
	}

	async rebootOrder(orderId) {
		const order = await this._getOrderById(orderId)

		if (
			order.status != Order.statuses.CANCELLED &&
			order.status != Order.statuses.DELIVERED
		) {
			throw new Error(`Заказ #${orderId} всё ещё в работе`)
		}

		if (order.driverId) order.status = Order.statuses.ACCEPTED
		else order.status = Order.statuses.WHAITING
		await order.save()

		this.io.of('/order').emit('order.update', order)

		return order
	}

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
			],
		})

		if (!order) {
			throw new Error(`Заказ #${orderId} не найден`)
		}

		return order
	}
}

module.exports = AdminOrderService
