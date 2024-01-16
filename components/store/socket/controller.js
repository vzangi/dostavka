const BaseSocketController = require('../../BaseSocketController')
const Service = require('./service')

class StoreSocketController extends BaseSocketController {
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
}

module.exports = (io, socket) => {
  return new StoreSocketController(io, socket, Service)
}
