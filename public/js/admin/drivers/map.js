$(function () {
  $('.btn-show-map').click(function () {
    showMap()
    $(this).hide()
  })

  function showMap() {
    const base = 'https://static-maps.yandex.ru/v1'
    // const apiKey = '364d70b1-3c74-4661-b649-011c0e6d696f'
    const { latitude, longitude, zoom } = $('.btn-show-map').data()
    const apiKey2 = 'dbbcb516-093e-4f66-9fcf-3a152aa0d7bd'
    const s = `${base}?ll=${longitude},${latitude}&lang=ru_RU&size=400,400&z=${zoom}&pt=${longitude},${latitude}&apikey=${apiKey2}`
    $('#map').html($(`<img src=${s}>`))
  }

  $('#map').on('click', 'img', function () {
    const { zoom } = $('.btn-show-map').data()
    $('.btn-show-map').data().zoom = zoom + 1
    showMap()
  })

  $('#map').on('contextmenu', 'img', function () {
    const { zoom } = $('.btn-show-map').data()
    $('.btn-show-map').data().zoom = zoom - 1
    showMap()
    return false
  })

  $('.btn-show-map').click()
})
