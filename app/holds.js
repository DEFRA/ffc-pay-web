const moment = require('moment')
const { getSchemeNames } = require('ffc-pay-schemes')
const { getProcessingData } = require('./api')

const { BPS } = getSchemeNames()

const getHolds = async (page = 1, pageSize = 100, usePagination = true) => {
  let url = '/payment-holds'
  if (usePagination) {
    url += `?page=${page}&pageSize=${pageSize}`
  }
  const { payload } = await getProcessingData(url)
  return payload.paymentHolds?.filter(x => x.dateTimeClosed == null).map(x => {
    x.dateTimeAdded = moment(x.dateTimeAdded).format('DD/MM/YYYY HH:mm')

    const fieldsToFormat = ['marketingYear', 'agreementNumber', 'contractNumber']
    fieldsToFormat.forEach(field => {
      if (!x[field]) {
        x[field] = 'All'
        if (x.holdCategorySchemeName !== BPS || field === 'marketingYear') {
          x.canBeRemoved = true
        }
      }
    })
    return x
  })
}

const getHoldCategories = async () => {
  const { payload } = await getProcessingData('/payment-hold-categories')

  const mappedCategories = payload.paymentHoldCategories.sort((a, b) => a.name.localeCompare(b.name))

  const schemesMap = Object.fromEntries(
    mappedCategories.map(c => [c.schemeId, { id: c.schemeId, name: c.schemeName }])
  )

  const schemes = Object.values(schemesMap).sort((a, b) => a.name.localeCompare(b.name))

  return {
    schemes,
    paymentHoldCategories: mappedCategories
  }
}

module.exports = {
  getHolds,
  getHoldCategories
}
