const Jimp = require('jimp')
const fs = require('fs')

class BaseUserService {
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

      this.removeAvatar(user)

      // Сохраняю автарку в базу
      user.avatar = fileName
      await user.save()

      return fileName
    } catch (error) {
      console.log(error)
    }
  }

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
