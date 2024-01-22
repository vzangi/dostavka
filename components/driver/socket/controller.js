const BaseSocketController = require('../../BaseSocketController')
const Service = require('./service')

class DriverSocketController extends BaseSocketController {
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
  async getOrderById(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.getOrderById(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Подтвердить, что заказ был забран из магазина
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
   * Взять заказ в работу
   */
  async acceptOrder(req, callback) {
    try {
      const { orderId } = req
      const data = await this.service.acceptOrder(orderId)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Отказаться от заказа
   */
  async refuseOrder(req, callback) {
    try {
      const { orderId, reason } = req
      const data = await this.service.refuseOrder(orderId, reason)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Вернуть заказ в магазин
   */
  async revertOrder(req, callback) {
    try {
      const { orderId, reason } = req
      const data = await this.service.revertOrder(orderId, reason)
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Выполнить заказ
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

  /**
   * Получить баланс
   */
  async getWallet(callback) {
    try {
      const data = await this.service.getWallet()
      callback({ status: 0, data })
    } catch (error) {
      callback({ status: 1, msg: error.message })
    }
  }

  /**
   * Обновление данных о местоположении
   */
  async setPosition(req) {
    try {
      const { latitude, longitude } = req
      await this.service.setPosition(latitude, longitude)
    } catch (error) {}
  }
}

module.exports = (io, socket) => {
  return new DriverSocketController(io, socket, Service)
}
