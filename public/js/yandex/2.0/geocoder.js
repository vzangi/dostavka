const y_geocoder = async (address) => {
  const y_api_key = '94d0753e-be15-4a36-83f2-25082d18b6bc'
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${y_api_key}&format=json&geocode=${address}`

  const res = await $.get(url)

  if (!res) return null

  const { featureMember } = res.response.GeoObjectCollection

  if (!featureMember || featureMember.length == 0) return null

  const [lon, lat] = featureMember[0].GeoObject.Point.pos.split(' ')

  return { lat, lon }
}
