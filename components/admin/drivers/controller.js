const Service = require('./service')
const BaseController = require('../../BaseController')

class AdminDriverController extends BaseController {
  /**
   * Странциа со списком курьеров
   */
  async main(req, res) {
    try {
      const data = await this.service.main()
      res.render('page/admin/drivers', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Форма добавления курьера
   */
  async addDriverForm(req, res) {
    try {
      const data = await this.service.addDriverFormData()
      res.render('page/admin/drivers/add', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Процедура добавления курьера
   */
  async addDriver(req, res) {
    try {
      // Создаю курьера
      const driver = await this.service.addDriver(req.body)

      // Если в запросе пришёл файл
      if (req.files) {
        const { avatar } = req.files
        // и это файл с аватаром
        if (avatar) {
          // Устанавливаю аватар курьера
          await this.service.setAvatar(avatar, driver)
        }
      }
      res.redirect('/admin/drivers')
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Форма редактирования курьера
   */
  async editDriverForm(req, res) {
    try {
      const { id } = req.params
      const data = await this.service.editDriverFormData(id)
      res.render('page/admin/drivers/edit', data)
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Процедура редактирования курьера
   */
  async editDriver(req, res) {
    try {
      // Редактирую курьера
      const driver = await this.service.editDriver(req.body)
      // Если в запросе был файл
      if (req.files) {
        const { avatar } = req.files
        // и этот файл - автар
        if (avatar) {
          // Меняю аватар курьера
          await this.service.setAvatar(avatar, driver)
        }
      }
      res.redirect('/admin/drivers')
    } catch (error) {
      this.page404(res)
    }
  }

  /**
   * Процедура удаления курьера
   */
  async removeDriver(req, res) {
    try {
      const { id } = req.params
      await this.service.removeDriver(id)
      res.redirect('/admin/drivers')
    } catch (error) {
      this.page404(res)
    }
  }
}

module.exports = new AdminDriverController(Service)
