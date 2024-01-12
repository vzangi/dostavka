const Order = require('../../../models/Order')
const User = require('../../../models/User')
const City = require('../../../models/City')

class AdminOrderService {
  async main() {
    const cities = await City.findAll({
      order: [['name']],
    })
    const data = {
      cities,
    }
    return data
  }

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
}

module.exports = AdminOrderService
