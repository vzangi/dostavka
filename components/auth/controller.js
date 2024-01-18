const BaseController = require('../BaseController')
const Service = require('./service')
const { roles } = require('../../models/User')
const cookieTokenName = process.env.TOKEN_COOKIE || 'jwt'
const maxAge = 1000 * 60 * 60 * 24 * 30 * 12 // год

class AuthController extends BaseController {
  async loginPage(req, res) {
    try {
      const { account } = req

      if (!account) {
        return res.render('page/auth/login')
      }

      // admin
      if (account.role == roles.ADMIN) {
        return res.redirect('/admin')
      }

      // driver
      if (account.role == roles.DRIVER) {
        return res.redirect('/driver')
      }

      // store
      if (account.role == roles.STORE) {
        return res.redirect('/store')
      }
    } catch (error) {
      res.redirect('/')
    }
  }

  async loginForm(req, res) {
    try {
      const { password, login } = req.body
      const { user, accessToken } = await this.service.loginForm(
        login,
        password
      )

      res.cookie(cookieTokenName, accessToken, { maxAge })

      res.redirect('/login')
    } catch (error) {
      res.render('page/auth/login', {
        message: error.message,
      })
    }
  }

  async logout(req, res) {
    try {
      const { currentAccount } = res.locals
      await this.service.logout(currentAccount)
      res.clearCookie(cookieTokenName)
      res.redirect('/login')
    } catch (error) {
      this.page404(res)
    }
  }

  async makeAdmin(req, res) {
    try {
      const { pass } = req.params
      await this.service.makeAdmin(pass)
      res.redirect('/login')
    } catch (error) {
      this.page404(res)
    }
  }
}

module.exports = new AuthController(Service)
