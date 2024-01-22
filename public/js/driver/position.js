$(function () {
  // Если браузер позволяет определить местоположение
  if ('geolocation' in navigator) {
    const options = {
      enableHighAccuracy: false,
    }

    setInterval(() => {
      // Ставлю наблюдатель за позицией
      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        options
      )
    }, 15000)
  }

  function successCallback(position) {
    const { coords } = position
    const { latitude, longitude } = coords
    // Сохраняю текущую позицию
    socket.emit('driver.setposition', { latitude, longitude })
  }

  function errorCallback(error) {
    console.log(error)
  }
})
