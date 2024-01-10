'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert('cities', [
			{
				name: 'Владикавказ',
			},
		])
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('cities', null, {})
	},
}
