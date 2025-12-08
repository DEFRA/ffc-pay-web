const baseHolds = [
  {
    holdId: 1,
    frn: '1234567890',
    marketingYear: '2022',
    agreementNumber: 'A123456',
    contractNumber: 'A654321',
    holdCategoryName: 'Outstanding debt',
    holdCategorySchemeId: 1,
    holdCategorySchemeName: 'SFI23',
    dateTimeAdded: '2021-08-26T13:29:28.949Z',
    dateTimeClosed: null
  },
  {
    holdId: 4,
    frn: '1111111111',
    marketingYear: '2023',
    agreementNumber: 'S12345678',
    contractNumber: 'S12345678',
    holdCategoryName: 'Outstanding debt',
    holdCategorySchemeId: 1,
    holdCategorySchemeName: 'SFI23',
    dateTimeAdded: '2021-09-14T22:35:28.885Z',
    dateTimeClosed: '2021-09-14T22:41:44.659Z'
  }
]

const categories = [
  {
    holdCategoryId: 123,
    schemeId: 1,
    name: 'my hold category',
    schemeName: 'schemeName'
  }
]

module.exports = { baseHolds, categories }
