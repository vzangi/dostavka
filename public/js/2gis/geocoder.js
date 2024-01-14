const api_key = '4979458a-92d3-435c-9246-fa4bd71d2e90'

const geocoder = async (address) => {
	const url = `https://catalog.api.2gis.com/3.0/items/geocode?q=${address}&fields=items.point&key=${api_key}`

	const { result } = await $.get(url)

	if (!result) return null

	if (!result.total || result.total == 0) return null

	const { point } = result.items[0]

	return point
}
