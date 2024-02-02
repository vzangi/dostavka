const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')

class AdminOrderService {
  /**
   * Данные для страницы списка заказов
   */
  async main() {
    const cities = await City.findAll({
      order: [['name']],
    })

    const stores = await User.findAll({
      where: {
        role: User.roles.STORE,
        active: true,
      },
      order: [['username']],
    })

    const drivers = await User.findAll({
      where: {
        role: User.roles.DRIVER,
        active: true,
      },
      order: [['username']],
    })

    const data = {
      cities,
      stores,
      drivers,
    }

    return data
  }

  /**
   * Данные для формы создания заказа
   */
  async addOrderFormData() {
    const stores = await User.findAll({
      where: {
        role: User.roles.STORE,
        active: true,
      },
      order: [['username']],
      include: [{ model: City }],
    })
    const data = {
      stores,
    }
    return data
  }

  /**
   *  Процедура создания заказа
   */
  async addOrder(orderData) {
    const {
      clientPhone,
      summ,
      storeId,
      address,
      latitude,
      longitude,
      comment,
    } = orderData

    if (!clientPhone || !storeId || !address) {
      throw new Error('Нет необходимых данных')
    }

    if (latitude == '') {
      delete orderData.latitude
    }

    if (longitude == '') {
      delete orderData.longitude
    }

    const store = await User.findByPk(storeId)

    if (!store) {
      throw new Error('Магазин не найден')
    }

    if (store.role != User.roles.STORE) {
      throw new Error('Магазин не найден')
    }

    if (!store.active) {
      throw new Error('Магазин заблокирован')
    }

    orderData.cityId = store.cityId

    const newOrder = await Order.create(orderData)

    return newOrder
  }

  /**
   * Данные для формы редактирования заказа
   */
  async editOrderFormData(id) {
    if (!id) {
      throw new Error('Нет необходимых данных')
    }

    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'store',
        },
        {
          model: City,
        },
      ],
    })

    if (!order) {
      throw new Error('Заказ не найден')
    }

    const data = {
      order,
      statusNames: Order.statusNames,
    }

    return data
  }

  /**
   * Процедура изменения заказа
   */
  async editOrder(orderData) {
    const { id, clientPhone, summ, address, latitude, longitude, comment } =
      orderData

    if (!id || !clientPhone || !address) {
      throw new Error('Нет необходимых данных')
    }

    const order = await Order.findByPk(id)

    if (!order) {
      throw new Error('Заказ не найден')
    }

    order.clientPhone = clientPhone
    order.address = address
    order.summ = summ
    order.latitude = latitude
    order.longitude = longitude
    order.comment = comment

    await order.save()

    return order
  }

  /**
   * Данные для страницы управления заказом
   */
  async getOrder(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: City,
        },
        {
          model: User,
          as: 'store',
        },
        {
          model: User,
          as: 'driver',
        },
      ],
    })

    const { statusNames } = Order

    const drivers = await User.findAll({
      where: {
        role: User.roles.DRIVER,
        cityId: order.cityId,
        active: true,
        online: true,
      },
    })

    const data = {
      order,
      statusNames,
      drivers,
    }

    return data
  }

  /**
   * Процедура удаления заказа
   */
  async removeOrder(id) {
    if (!id) {
      throw new Error('Нет необходимых данных')
    }

    const order = await Order.findByPk(id)

    if (!order) {
      throw new Error('Заказ не найден')
    }

    // Удаляю заказ
    await order.destroy()
  }
}

module.exports = AdminOrderService
