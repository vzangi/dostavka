'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'users',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        login: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING,
        },
        city: {
          type: Sequelize.STRING,
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
        role: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
        },
        telegramChatId: {
          type: Sequelize.STRING,
        },
        avatar: {
          type: Sequelize.STRING,
        },
        wallet: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
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
      })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users')
  }
};
