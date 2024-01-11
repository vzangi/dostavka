const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminCityController extends BaseController {
  async main(req, res) {
    try {
      const data = await this.service.main()
      res.render('page/admin/cities', data)
    } catch (error) {
      this.page404(res)
    }
  }

  async addCityForm(req, res) {
    try {
      const data = await this.service.addCityFormData()
      res.render('page/admin/cities/add', data)
    } catch (error) {
      this.page404(res)
    }
  }

  async addCity(req, res) {
    try {
      await this.service.addCity(req.body)

      res.redirect('/admin/cities')
    } catch (error) {
      this.page404(res)
    }
  }

  async editCityForm(req, res) {
    try {
      const { id } = req.params
      const data = await this.service.editCityFormData(id)
      res.render('page/admin/cities/edit', data)
    } catch (error) {
      this.page404(res)
    }
  }

  async editCity(req, res) {
    try {
      await this.service.editCity(req.body)

      res.redirect('/admin/cities')
    } catch (error) {
      this.page404(res)
    }
  }

  async removeCity(req, res) {
    try {
      const { id } = req.params
      await this.service.removeCity(id)

      res.redirect('/admin/cities')
    } catch (error) {
      this.page404(res)
    }
  }
}

module.exports = new AdminCityController(Service)
