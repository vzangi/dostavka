const BaseSocketController = require('../../../BaseSocketController')
const Service = require('./service')

class AdminStoreController extends BaseSocketController {
  async getStores(filter, callback) {
    try {
      const data = await this.service.getStores(filter)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }
}

module.exports = (io, socket) => {
  return new AdminStoreController(io, socket, Service)
}
