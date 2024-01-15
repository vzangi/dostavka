module.exports = (io, socket) => {
  const controller = require('./controller')(io, socket)

  // Список последних заказов
  socket.on('drivers.get', controller.getDrivers.bind(controller))
}
