const Jimp = require('jimp')
const fs = require('fs')

/**
 * Базовый класс для пользователя
 */
class BaseUserService {
	/**
	 * Процедура смены аватара
	 * @param {*} avatar Файл аватара пользователя
	 * @param {*} user Объект пользователя
	 */
	async setAvatar(avatar, user) {
		if (!avatar || !user) {
			throw new Error('Нет необходимых данных')
		}

		try {
			let ext = ''
			if (avatar.mimetype == 'image/jpeg') ext = 'jpg'
			if (avatar.mimetype == 'image/png') ext = 'png'

			if (ext == '') {
				throw new Error('Можно загружать только фото в формате: jpg, png')
			}

			// Использую в названии случайные данные
			const rnd1 = Math.ceil(Math.random() * 10000)

			// Формирую имя новой автарки
			const fileName = `${user.id}-${rnd1}.${ext}`

			// Запрещаю загрузку автарок больше 5 мегабайт
			if (avatar.size > 5_000_000) {
				throw new Error('Размер фото не должно превышать ограничение в 5Mb')
			}

			// Если размер аватарки больше 300 Кб, то сжимаю её
			if (avatar.size > 300_000) {
				const img = await Jimp.read(avatar.data)
				img.resize(250, Jimp.AUTO).writeAsync('./public/uploads/' + fileName)
			} else {
				// Перемещаю загруженное фото в папку с загрузками
				await avatar.mv('./public/uploads/' + fileName)
			}

			// Удаляю старый файл
			this.removeAvatar(user)

			// Сохраняю имя новой автарки в базу
			user.avatar = fileName
			await user.save()
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * Удаление файла аватарки пользователя
	 * @param {*} user Инстанс пользователя
	 */
	async removeAvatar(user) {
		if (user.avatar) {
			// Удаляю фото, чтобы не захламлять сервер
			fs.unlink(`${__dirname}/../public/uploads/${user.avatar}`, (err) => {
				if (err) console.log(err)
			})
		}
	}
}

module.exports = BaseUserService
