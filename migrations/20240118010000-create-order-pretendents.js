'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'orderPretendents',
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
        orderId: {
          type: Sequelize.INTEGER,
          onDelete: 'CASCADE',
          onUpdate: 'NO ACTION',
          allowNull: false,
          references: {
            model: 'orders',
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
    await queryInterface.dropTable('orderPretendents')
  },
}
