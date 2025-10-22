const moment = require('moment')
const { getProcessingData } = require('./api')

const getHolds = async (page = 1, pageSize = 100, usePagination = true) => {
  let url = '/payment-holds'
  if (usePagination) {
    url += `?page=${page}&pageSize=${pageSize}`
  }
  const { payload } = await getProcessingData(url)
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
  const { payload } = await getProcessingData('/payment-hold-categories')

  console.log(payload.paymentHoldCategories)

  const mappedCategories = payload.paymentHoldCategories.map(category => ({
    ...category,
    schemeName: normalizeSchemeName(category.schemeName)
  }))

  const schemesMap = Object.fromEntries(
    mappedCategories.map(c => [c.schemeId, { id: c.schemeId, name: c.schemeName }])
  )

  return {
    schemes: Object.values(schemesMap),
    paymentHoldCategories: mappedCategories
  }
}

const normalizeSchemeName = (name) => {
  if (name === 'Vet Visits') return 'Annual Health and Welfare Review'
  if (name === 'SFI') return 'SFI22'
  return name
}

module.exports = {
  getHolds,
  getHoldCategories
}
