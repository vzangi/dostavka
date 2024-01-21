const BaseSocketController = require('../../BaseSocketController')
const Service = require('./service')

class StoreSocketController extends BaseSocketController {
	/**
	 * Получение списка отфильтрованных заказов
	 */
	async getOrders(filter, callback) {
		try {
			const data = await this.service.getOrders(filter)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	/**
	 * Получение заказа по номеру
	 */
	async getOrder(req, callback) {
		try {
			const { orderId } = req
			const data = await this.service.getOrder(orderId)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	/**
	 * Создание заказа
	 */
	async createOrder(orderData, callback) {
		try {
			const data = await this.service.createOrder(orderData)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	/**
	 * Изменение заказа
	 */
	async updateOrder(orderData, callback) {
		try {
			const data = await this.service.updateOrder(orderData)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	/**
	 * Установка статуса указывающего, что курьер забрал заказ
	 */
	async takedOrder(req, callback) {
		try {
			const { orderId } = req
			const data = await this.service.takedOrder(orderId)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	/**
	 * Отмена заказа с указанием причины
	 */
	async cancelOrder(req, callback) {
		try {
			const { orderId, reason } = req
			const data = await this.service.cancelOrder(orderId, reason)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}
}

module.exports = (io, socket) => {
	return new StoreSocketController(io, socket, Service)
}
