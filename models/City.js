const { DataTypes, Op } = require('sequelize')
const sequelize = require('../unit/db')

const City = sequelize.define(
	'cities',
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
	},
	{
		timestamps: false,
	}
)

module.exports = City
