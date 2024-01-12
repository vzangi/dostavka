const { DataTypes, Op } = require('sequelize')
const { coolDate } = require('../unit/dateHelper')
const { tel } = require('../unit/phoneHelper')
const sequelize = require('../unit/db')
const City = require('./City')
const User = require('./User')

const statuses = {
	// Заказ ожидает назначения доставщика
	WHAITING: 1,

	// Заказу назначен доставщик
	ACCEPTED: 2,

	// Доставщик забрал заказ
	TAKED: 3,

	// Заказ доставлен
	DELIVERED: 4,

	// Заказ отменён
	CANCELLED: 5,
}

const statusNames = ['', 'Ожидает', 'Принят', 'В пути', 'Доставлен', 'Отменён']

const Order = sequelize.define('orders', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	status: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
	},
	clientPhone: {
		type: DataTypes.STRING,
	},
	summ: {
		type: DataTypes.INTEGER,
	},
	storeId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	driverId: {
		type: DataTypes.INTEGER,
	},
	cityId: {
		type: DataTypes.INTEGER,
	},
	address: {
		type: DataTypes.STRING,
	},
	latitude: {
		type: DataTypes.DECIMAL(11, 6),
	},
	longitude: {
		type: DataTypes.DECIMAL(11, 6),
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
	tel: {
		type: DataTypes.VIRTUAL(DataTypes.STRING),
		get() {
			return tel(this.clientPhone)
		},
	},
})

Order.statuses = statuses
Order.statusNames = statusNames

Order.belongsTo(User, { as: 'store', foreignKey: 'storeId' })
Order.belongsTo(User, { as: 'driver', foreignKey: 'driverId' })
Order.belongsTo(City)

User.hasMany(Order, { as: 'driverOrders', foreignKey: 'driverId' })
User.hasMany(Order, { as: 'storeOrders', foreignKey: 'storeId' })

module.exports = Order
