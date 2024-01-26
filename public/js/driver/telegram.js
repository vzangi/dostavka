$(function () {
  confirm('Подключить уведомления в телеграм?').then((accept) => {
    if (!accept) return

    // Получение ссылки на подключение телеграмм уведомлений
    socket.emit('driver.getlink', (res) => {
      const { status, msg, data } = res
      if (status != 0) return alert(msg)

      // Достаю ссылку
      const { link } = data

      // Открываю её
      window.open(link, '_blank')
    })
  })
})
