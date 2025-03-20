const convertDateToDDMMYYYY = (date) => {
  if (!date) {
    return null
  }
  const dateObj = new Date(date)
  return isNaN(dateObj) ? null : dateObj.toLocaleDateString('en-GB')
}

module.exports = {
  convertDateToDDMMYYYY
}
