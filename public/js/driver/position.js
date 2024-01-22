$(function () {
  // Если браузер позволяет определить местоположение
  if ('geolocation' in navigator) {
    const options = {
      enableHighAccuracy: false,
    }
    navigator.geolocation.watchPosition(successCallback, errorCallback, options)
  }

  function successCallback(position) {
    const { coords } = position
    const { latitude, longitude } = coords

    console.log(latitude, longitude)
    // Сохраняю текущую позицию
    socket.emit('driver.setposition', { latitude, longitude })

    $('h2').toggleClass('bg-danger')
  }

  function errorCallback(error) {
    console.log(error)
  }
})
