'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable(
			'orders',
			{
				id: {
					type: Sequelize.INTEGER,
					allowNull: false,
					primaryKey: true,
					autoIncrement: true,
				},
				status: {
					type: Sequelize.INTEGER,
					defaultValue: 1,
				},
				clientPhone: {
					type: Sequelize.STRING,
				},
				summ: {
					type: Sequelize.INTEGER,
				},
				storeId: {
					type: Sequelize.INTEGER,
					onDelete: 'CASCADE',
					onUpdate: 'NO ACTION',
					allowNull: false,
					references: {
						model: 'users',
						key: 'id',
					},
				},
				driverId: {
					type: Sequelize.INTEGER,
					onDelete: 'CASCADE',
					onUpdate: 'NO ACTION',
					references: {
						model: 'users',
						key: 'id',
					},
				},
				cityId: {
					type: Sequelize.INTEGER,
					onDelete: 'CASCADE',
					onUpdate: 'NO ACTION',
					references: {
						model: 'cities',
						key: 'id',
					},
				},
				address: {
					type: Sequelize.STRING,
				},
				latitude: {
					type: Sequelize.DECIMAL(11, 6),
				},
				longitude: {
					type: Sequelize.DECIMAL(11, 6),
				},
				comment: {
					type: Sequelize.TEXT,
				},
				createdAt: {
					type: Sequelize.DATE,
					allowNull: false,
				},
				updatedAt: {
					type: Sequelize.DATE,
					allowNull: false,
				},
			},
			{
				charset: 'utf8mb4',
				collate: 'utf8mb4_general_ci',
			}
		)
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('orders')
	},
}
