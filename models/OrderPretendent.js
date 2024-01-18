const { DataTypes } = require('sequelize')
const sequelize = require('../unit/db')
const User = require('./User')
const Order = require('./Order')

const statuses = {
  // Претендент думает
  WHAITING: 1,

  // Принял заказ
  ACCEPTED: 2,

  // Отказался от заказа
  CANCELLED: 3,
}

const OrderPretendednt = sequelize.define('orderPretendents', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  driverId: {
    type: DataTypes.INTEGER,
  },
})

OrderPretendednt.belongsTo(User, { as: 'driver', foreignKey: 'driverId' })
OrderPretendednt.belongsTo(Order)

OrderPretendednt.statuses = statuses

Order.hasMany(OrderPretendednt)

module.exports = OrderPretendednt
