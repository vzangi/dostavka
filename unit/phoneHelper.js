const tel = (phone) => {
	return phone
		.split('')
		.filter((d, i) => {
			if (i == 0 && d == '+') return true
			if ('0123456789'.indexOf(d) >= 0) return true
			return false
		})
		.join('')
}

module.exports = {
	tel,
}
