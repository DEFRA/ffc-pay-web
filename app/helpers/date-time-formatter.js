const moment = require('moment')

// Constructs a date string from day/month/year inputs
const formatDateFromParts = (day, month, year) => {
  if (!day || !month || !year) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Parses a date string with optional format and returns 'DD/MM/YYYY'
const formatDateFromString = (dateToFormat, currentDateFormat = 'DD/MM/YYYY HH:mm') => {
  if (dateToFormat) {
    return moment(dateToFormat, currentDateFormat).format('DD/MM/YYYY')
  }
  return 'Unknown'
}

// Parses a date string with optional format and returns 'DD/MM/YYYY - HH:mm'
const formatDateTimeFromString = (dateToFormat, currentDateFormat = moment.ISO_8601) => {
  if (!dateToFormat) {
    return 'Unknown'
  }

  const parsed = moment(dateToFormat, currentDateFormat, true)
  return parsed.isValid()
    ? parsed.format('DD/MM/YYYY - HH:mm')
    : 'Invalid date'
}

module.exports = {
  formatDateFromParts,
  formatDateFromString,
  formatDateTimeFromString
}
