const BaseSocketController = require('../../../BaseSocketController')
const Service = require('./service')

class AdminOrderController extends BaseSocketController {
  async createOrder(orderData, callback) {
    try {
      const data = await this.service.createOrder(orderData)
      callback({ status: 0, data })
    } catch (error) {
      console.log(error)
      callback({ status: 1, msg: error.message })
    }
  }

  async updateOrder(orderData, callback) {
    try {
      const data = await this.service.updateOrder(orderData)
      callback({ status: 0, data })
    } catch (error) {
      console.log(error)
      callback({ status: 1, msg: error.message })
    }
  }

  async getOrders(filter, callback) {
    try {
      const data = await this.service.getOrders(filter)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async getOrderById(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.getOrderById(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async setDriver(req, callback) {
    try {
      const { orderId, driverId } = req
      const data = await this.service.setDriver(orderId, driverId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async revertDriver(req, callback) {
    try {
      const { orderId, driverId } = req
      const data = await this.service.revertDriver(orderId, driverId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async takedOrder(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.takedOrder(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async cancelOrder(req, callback) {
    try {
      const { orderId, reason } = req
      const data = await this.service.cancelOrder(orderId, reason)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async rebootOrder(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.rebootOrder(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  async completeOrder(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.completeOrder(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }
}

module.exports = (io, socket) => {
  return new AdminOrderController(io, socket, Service)
}
