const BaseSocketController = require('../../../BaseSocketController')
const Service = require('./service')

class AdminOrderController extends BaseSocketController {
  async getOrders(filter, callback) {
    try {
      const data = await this.service.getOrders(filter)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }
}

module.exports = (io, socket) => {
  return new AdminOrderController(io, socket, Service)
}
