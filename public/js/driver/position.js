$(function () {
  let lat = 0
  let lon = 0

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

    const d = Math.floor(distance(lat, lon, latitude, longitude) * 1000)

    lat = latitude
    lon = longitude

    if (d < 10) return

    // Сохраняю текущую позицию
    socket.emit('driver.setposition', { latitude, longitude })
  }

  function errorCallback(error) {
    console.log(error)
  }

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }
})
