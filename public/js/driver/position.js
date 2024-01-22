$(function () {
  // Если браузер позволяет определить местоположение
  if ('geolocation' in navigator) {
    getPosition()
  }

  function getPosition() {
    const options = {
      enableHighAccuracy: false,
    }
    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      options
    )

    setTimeout(getPosition, 5000)
  }

  function successCallback(position) {
    const { coords } = position
    const { latitude, longitude } = coords
    // Сохраняю текущую позицию
    socket.emit('driver.setposition', { latitude, longitude })

    $('.driver-wallet').parent().text(`${latitude};${longitude}`)
  }

  function errorCallback(error) {
    console.log(error)
  }
})
