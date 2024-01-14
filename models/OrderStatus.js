const { DataTypes } = require('sequelize')
const sequelize = require('../unit/db')
const User = require('./User')
const Order = require('./Order')
const { coolDate } = require('../unit/dateHelper')

const OrderStatus = sequelize.define('orderStatuses', {
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
	userId: {
		type: DataTypes.INTEGER,
	},
	comment: {
		type: DataTypes.TEXT,
	},
	coolDate: {
		type: DataTypes.VIRTUAL(DataTypes.STRING),
		get() {
			return coolDate(this.createdAt)
		},
	},
})

OrderStatus.belongsTo(User)
OrderStatus.belongsTo(Order)

Order.hasMany(OrderStatus)

module.exports = OrderStatus
