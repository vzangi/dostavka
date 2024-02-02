const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminOrderController extends BaseController {
  /**
   * Страница списка заказов
   */
  async main(req, res) {
    try {
      const data = await this.service.main()
      res.render('page/admin/orders', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Форма создания заказа
   */
  async addOrderForm(req, res) {
    try {
      const data = await this.service.addOrderFormData()
      res.render('page/admin/orders/add', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Процедура создания заказа
   */
  async addOrder(req, res) {
    try {
      const order = await this.service.addOrder(req.body)

      res.redirect(`/admin/orders/${order.id}`)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Форма редактирования заказа
   */
  async editOrderForm(req, res) {
    try {
      const { id } = req.params
      const data = await this.service.editOrderFormData(id)
      res.render('page/admin/orders/edit', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Процедура редактирования заказа
   */
  async editOrder(req, res) {
    try {
      const order = await this.service.editOrder(req.body)

      res.redirect(`/admin/orders/${order.id}`)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Страница управления заказом
   */
  async getOrder(req, res) {
    try {
      const { id } = req.params
      const data = await this.service.getOrder(id)
      res.render('page/admin/orders/item', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Процедура удаления заказа
   */
  async removeOrder(req, res) {
    try {
      const { id } = req.params
      await this.service.removeOrder(id)
      res.redirect('/admin/orders')
    } catch (error) {
      this.page404(res)
    }
  }
}

module.exports = new AdminOrderController(Service)
