module.exports = (io, socket) => {
  const controller = require('./controller')(io, socket)

  // Список последних заказов
  socket.on('stores.get', controller.getStores.bind(controller))
}
