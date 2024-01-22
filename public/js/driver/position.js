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

    const d = distance(lat, lon, latitude, longitude)
    console.log(lat, lon)
    console.log(latitude, longitude)
    console.log('d=', d)

    lat = latitude
    lon = longitude

    $('#delivery-address').val(d)

    if (d == 0) return

    // Сохраняю текущую позицию
    socket.emit('driver.setposition', { latitude, longitude })

    $('h2').toggleClass('bg-danger')
  }

  function errorCallback(error) {
    console.log(error)
  }

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }
})
