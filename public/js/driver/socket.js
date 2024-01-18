const socket = io('/driver')

setTimeout(() => {
  socket.on('connect', () => location.reload())
}, 5000)
