const minDayMonth = 1
const maxDay = 31
const maxMonth = 12
const minYear = 2000
const maxYear = 2099

const isValidDatePart = (value, min, max) => {
  const number = Number(value)

  return Number.isInteger(number) &&
    number >= min &&
    number <= max
}

const isValidDate = (day, month, year) => {
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
}

const addDateErrorIfRequired = (error, payload) => {
  const { day, month, year } = payload

  const dayIsValid = isValidDatePart(day, minDayMonth, maxDay)
  const monthIsValid = isValidDatePart(month, minDayMonth, maxMonth)
  const yearIsValid = isValidDatePart(year, minYear, maxYear)

  if (!dayIsValid || !monthIsValid || !yearIsValid) {
    return error
  }

  if (isValidDate(day, month, year)) {
    return error
  }

  const hasDateError = error.details.some(err => err.type === 'date.invalid')

  if (hasDateError) {
    return error
  }

  error.details.push({
    message: 'Enter a valid date',
    path: ['closureDate'],
    type: 'date.invalid',
    context: {
      key: 'closureDate',
      label: 'closureDate'
    }
  })

  return error
}

module.exports = {
  addDateErrorIfRequired,
  isValidDatePart,
  isValidDate,
  minDayMonth,
  maxDay,
  maxMonth,
  minYear,
  maxYear
}
