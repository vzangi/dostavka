'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'cities',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cities')
  }
};
