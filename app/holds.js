const moment = require('moment')
const { get } = require('./api')

const getHolds = async (page = 1, pageSize = 100, usePagination = true) => {
  let url = '/payment-holds'
  if (usePagination) {
    url += `?page=${page}&pageSize=${pageSize}`
  }
  const { payload } = await get(url)
  return payload.paymentHolds?.filter(x => x.dateTimeClosed == null).map(x => {
    x.dateTimeAdded = moment(x.dateTimeAdded).format('DD/MM/YYYY HH:mm')
    if (x.holdCategorySchemeName === 'SFI') {
      x.holdCategorySchemeName = 'SFI22'
    }

    const fieldsToFormat = ['marketingYear', 'agreementNumber', 'contractNumber']
    fieldsToFormat.forEach(field => {
      if (!x[field]) {
        x[field] = 'All'
        if (x.holdCategorySchemeName !== 'BPS' || field === 'marketingYear') {
          x.canBeRemoved = true
        }
      }
    })
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
