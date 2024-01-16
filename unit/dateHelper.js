const monthes = [
  'Января',
  'Февраля',
  'Марта',
  'Апреля',
  'Мая',
  'Июня',
  'Июля',
  'Августа',
  'Сентября',
  'Октября',
  'Ноября',
  'Декабря',
]

const _ = (d) => (d > 9 ? d : `0${d}`)

const coolDate = (date) => {
  const d = new Date(date)
  const month = d.getMonth()
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes()

  if (isToday(date)) {
    return `${_(hours)}:${_(minutes)}`
  }

  if (isYesterday(date)) {
    return `вчера ${_(hours)}:${_(minutes)}`
  }

  return `${day} ${monthes[month].toLowerCase()} ${_(hours)}:${_(minutes)}`
}

const isToday = (date) => {
  const today = new Date()
  return today.toDateString() == date.toDateString()
}

const isYesterday = (date) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toDateString() == date.toDateString()
}

const isoDateFromString = (date, endOfDay = false) => {
  const [day, month, year] = date.split('.')
  if (!endOfDay) return new Date(year, month * 1 - 1, day).toISOString()
  else return new Date(year, month * 1 - 1, day, 23, 59, 59).toISOString()
}

const isoBetweenDates = (date) => {
  const [day, month, year] = date.split('.')
  const dayBeginning = new Date(year, month * 1 - 1, day).toISOString()
  const dayEnd = new Date(year, month * 1 - 1, day, 23, 59, 59).toISOString()
  return [dayBeginning, dayEnd]
}

module.exports = {
  coolDate,
  isoDateFromString,
  isoBetweenDates,
}
