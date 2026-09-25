const { getSchemeNames } = require('ffc-pay-schemes')

const { SFI } = getSchemeNames()

const mockPaymentHoldCategories = [
  { holdCategoryId: 123, name: 'my hold category', schemeName: 'Scheme Name' }
]

const mockPaymentHolds = [
  { dateTimeClosed: null, dateTimeAdded: '2024-08-19T12:34:56Z', holdCategorySchemeName: SFI, marketingYear: null }
]

module.exports = { mockPaymentHoldCategories, mockPaymentHolds }
