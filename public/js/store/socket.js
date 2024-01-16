const socket = io('/store')

setTimeout(() => {
  socket.on('connect', () => location.reload())
}, 5000)
