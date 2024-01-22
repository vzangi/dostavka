const BaseSocketController = require('../../../BaseSocketController')
const Service = require('./service')

class AdminOrderController extends BaseSocketController {
  /**
   * Создание заказа
   */
  async createOrder(orderData, callback) {
    try {
      const data = await this.service.createOrder(orderData)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Обновление данных заказа
   */
  async updateOrder(orderData, callback) {
    try {
      const data = await this.service.updateOrder(orderData)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Получение отфильтрованного списка заказов
   */
  async getOrders(filter, callback) {
    try {
      const data = await this.service.getOrders(filter)
      callback({ status: 0, data })
    } catch (error) {
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
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Назначение курьера для заказа
   */
  async setDriver(req, callback) {
    try {
      const { orderId, driverId } = req
      const data = await this.service.setDriver(orderId, driverId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Снятие водителя с заказа
   */
  async revertDriver(req, callback) {
    try {
      const { orderId, driverId } = req
      const data = await this.service.revertDriver(orderId, driverId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Подтверждение, что курьер забрал заказ
   */
  async takedOrder(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.takedOrder(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Отмена заказа
   */
  async cancelOrder(req, callback) {
    try {
      const { orderId, reason } = req
      const data = await this.service.cancelOrder(orderId, reason)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Возврат заказа в работу
   */
  async rebootOrder(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.rebootOrder(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Пометить заказ выполненным
   */
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
