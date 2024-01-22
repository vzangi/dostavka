$(function () {
  $('#getPoint').click(async () => {
    const cityId = $(`[name='cityId']`).val()
    const cityName = $(`option[value=${cityId}]`).text()
    const address = $(`[name='address']`).val()
    const fullAddress = `${cityName}, ${address}`

    const point = await geocoder(fullAddress)

    if (!point) return alert('Не удалось получить координаты')

    $(`[name='latitude']`).val(point.lat)
    $(`[name='longitude']`).val(point.lon)
  })
})
