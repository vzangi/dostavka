const { hash, compare } = require('bcrypt')
const { createToken } = require('../../unit/jwt')
const User = require('../../models/User')
const saltNumber = 10

class AuthService {
  async loginForm(login, password) {
    if (!login || !password) {
      throw new Error('Нет необходимых данных')
    }

    const user = await User.findOne({
      where: { login },
    })

    if (!user) {
      throw new Error('Неверный логин или пароль')
    }

    if (!user.active) {
      throw new Error('Пользователь заблокирован')
    }

    const match = await compare(password, user.password)

    if (!match) {
      throw new Error('Неверный логин или пароль')
    }

    // Создаю токен авторизации
    const accessToken = createToken(user)

    // Указываю, что пользователь начал работу
    user.online = true
    await user.save()

    return {
      user,
      accessToken,
    }
  }

  async logout(account) {
    if (!account) {
      throw new Error('Не авторизован')
    }

    account.online = false
    await account.save()
  }

  async makeAdmin(pass) {
    if (!pass) {
      throw new Error('Нет необходимых данных')
    }

    if (pass != process.env.ADMIN_PASS) {
      throw new Error('Неверный пароль')
    }

    const username = 'admin'

    const hasAdmin = await User.findOne({
      where: { username },
    })

    if (hasAdmin) {
      throw new Error('Админ уже создан')
    }

    const password = await hash(pass, saltNumber)

    const data = {
      username,
      login: username,
      password,
      role: User.roles.ADMIN,
    }

    await User.create(data)
  }
}

module.exports = AuthService
