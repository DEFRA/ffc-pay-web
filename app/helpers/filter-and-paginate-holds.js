const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 100

const filterAndPaginateHolds = (paymentHolds, { frn, schemeName, page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE } = {}) => {
  let filteredHolds = paymentHolds
  if (frn) {
    filteredHolds = filteredHolds.filter(x => x.frn === String(frn))
  }
  if (schemeName) {
    filteredHolds = filteredHolds.filter(x => x.holdCategorySchemeName === schemeName)
  }

  const numberOfHolds = filteredHolds.length
  const start = (page - 1) * perPage

  return {
    paymentHolds: filteredHolds.slice(start, start + perPage),
    numberOfHolds,
    page,
    perPage
  }
}

module.exports = { filterAndPaginateHolds }
