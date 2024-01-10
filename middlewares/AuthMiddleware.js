const User = require('../models/User')

const isAuth = (req, res, next) => {
  const { user } = req
  if (user) return next()
  res.redirect('/login')
}

const isAdmin = (req, res, next) => {
  const { account } = req
  if (!account) throw new Error('Не авторизован')
  if (account.role != 0) throw new Error('Не администратор')
  next()
}

// добавляю авторизованного пользователя в переменную user шаблонизатора
const userToTemplate = async (req, res, next) => {
  const { user } = req

  if (!user) {
    return next()
  }

  const account = await User.findOne({
    where: {
      id: user.id,
    },
  })

  req.account = account
  res.locals.currentAccount = account

  next()
}

const userToSocket = async (socket, next) => {
  const { user } = socket
  if (!user) return next()

  const account = await Account.findOne({
    where: {
      id: user.id,
    },
    attributes: [
      'id',
      'username',
      'avatar',
      'vipTo',
      'online',
      'vip',
      'wallet',
      'status',
      'role',
      'gender',
      'rank',
      'level',
      'email',
    ],
  })

  socket.account = account

  next()
}

module.exports = {
  isAuth,
  isAdmin,
  userToTemplate,
  userToSocket,
}
