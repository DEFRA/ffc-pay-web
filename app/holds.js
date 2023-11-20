const moment = require('moment')
const { get } = require('./api')

const getHolds = async () => {
  const { payload } = await get('/payment-holds')
  return payload.paymentHolds?.filter(x => x.dateTimeClosed == null).map(x => {
    x.dateTimeAdded = moment(x.dateTimeAdded).format('DD/MM/YYYY HH:mm')
    if (x.holdCategorySchemeName === 'SFI') x.holdCategorySchemeName = 'SFI22'
    return x
  })
}

const getHoldCategories = async () => {
  const { payload } = await get('/payment-hold-categories')
  const schemes = [...new Set(payload.paymentHoldCategories.map(mapScheme))]
  return { schemes, paymentHoldCategories: payload.paymentHoldCategories }
}

const mapScheme = (scheme) => {
  if (scheme.schemeName === 'Vet Visits') {
    scheme.schemeName = 'Annual Health and Welfare Review'
  }
  if (scheme.schemeName === 'SFI') {
    scheme.schemeName = 'SFI22'
  }
  return scheme.schemeName
}

module.exports = {
  getHolds,
  getHoldCategories
}
