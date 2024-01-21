const BaseSocketController = require('../../BaseSocketController')
const Service = require('./service')

class DriverSocketController extends BaseSocketController {
	async getOrders(filter, callback) {
		try {
			const data = await this.service.getOrders(filter)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	async getOrderById(req, callback) {
		try {
			const { orderId } = req
			const data = await this.service.getOrderById(orderId)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

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

	async acceptOrder(req, callback) {
		try {
			const { orderId } = req
			const data = await this.service.acceptOrder(orderId)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

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

	async refuseOrder(req, callback) {
		try {
			const { orderId, reason } = req
			const data = await this.service.refuseOrder(orderId, reason)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	async revertOrder(req, callback) {
		try {
			const { orderId, reason } = req
			const data = await this.service.revertOrder(orderId, reason)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	async completeOrder(req, callback) {
		try {
			const { orderId } = req
			const data = await this.service.completeOrder(orderId)
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}

	async getWallet(callback) {
		try {
			const data = await this.service.getWallet()
			callback({ status: 0, data })
		} catch (error) {
			console.log(error)
			callback({ status: 1, msg: error.message })
		}
	}
}

module.exports = (io, socket) => {
	return new DriverSocketController(io, socket, Service)
}
