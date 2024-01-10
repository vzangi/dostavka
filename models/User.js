const { DataTypes, Op } = require('sequelize')
const sequelize = require('../unit/db')

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
  city: {
    type: DataTypes.STRING,
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
})

User.roles = roles

module.exports = User
