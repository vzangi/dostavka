const BaseSocketController = require('../../../BaseSocketController')
const Service = require('./service')

class AdminDriverController extends BaseSocketController {
  async getDrivers(filter, callback) {
    try {
      const data = await this.service.getDrivers(filter)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }
}

module.exports = (io, socket) => {
  return new AdminDriverController(io, socket, Service)
}
