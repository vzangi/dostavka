class BaseSocketController {
  constructor(io, socket, Service) {
    this.io = io
    this.socket = socket
    this.account = socket.account
    if (Service) {
      this.service = new Service(io, socket)
    }
  }
}

module.exports = BaseSocketController
