const { DataTypes, Op } = require('sequelize')
const { tel } = require('../unit/phoneHelper')
const sequelize = require('../unit/db')
const City = require('./City')

const roles = {
	ADMIN: 0,
	DRIVER: 1,
	STORE: 2,
}

const User = sequelize.define('users', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	login: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	phone: {
		type: DataTypes.STRING,
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
	role: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
	},
	telegramChatId: {
		type: DataTypes.STRING,
	},
	avatar: {
		type: DataTypes.STRING,
	},
	wallet: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
	},
	active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
	},
	online: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	tel: {
		type: DataTypes.VIRTUAL(DataTypes.STRING),
		get() {
			return tel(this.phone)
		},
	},
})

User.roles = roles

User.belongsTo(City)

module.exports = User
