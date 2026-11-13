const { DATE } = require('../constants/categories')
const { getData } = require('./get-data')

const getPaymentsByDate = async (schemeId, day, month, year) => {
  return getData(DATE, { schemeId, day, month, year })
}

module.exports = {
  getPaymentsByDate
}
