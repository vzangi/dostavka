class MainService {
  async main(account) {
    const city = await account.getCity()
    const data = {
      city,
    }
    return data
  }
}

module.exports = MainService
