const buildPaginationItems = require('../helpers/build-pagination-items')

const buildHoldsViewModel = ({
  results,
  page,
  perPage,
  frn,
  schemeName
}) => {
  const { numberOfHolds } = results

  const totalPages = Math.ceil(
    numberOfHolds / perPage
  )

  const paginationItems =
        buildPaginationItems(
          page,
          totalPages,
          perPage,
          {
            frn,
            name: schemeName
          }
        )

  const extraQuery = [
    frn
      ? `&frn=${encodeURIComponent(frn)}`
      : '',
    schemeName
      ? `&name=${encodeURIComponent(schemeName)}`
      : ''
  ].join('')

  return {
    ...results,
    frn,
    schemeName,
    page,
    perPage,
    numberOfHolds,
    totalPages,
    paginationItems,
    extraQuery
  }
}

module.exports = {
  buildHoldsViewModel
}
