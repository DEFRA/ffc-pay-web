const buildExtraQuery = extraParams =>
  Object.entries(extraParams)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `&${key}=${encodeURIComponent(value)}`)
    .join('')

const createPageItem = (pageNumber, hrefFor, current = false) => ({
  number: pageNumber,
  href: hrefFor(pageNumber),
  current
})

const buildAllPages = (totalPages, page, hrefFor) =>
  Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1

    return createPageItem(pageNumber, hrefFor, pageNumber === page)
  })

const buildStartPages = (page, totalPages, hrefFor) =>
  Array.from(
    { length: Math.min(page + 1, totalPages - 1) - 1 },
    (_, index) => {
      const pageNumber = index + 2

      return createPageItem(pageNumber, hrefFor, pageNumber === page)
    }
  )

const buildMiddlePages = (page, totalPages, hrefFor) => [
  { ellipsis: true },
  createPageItem(page - 1, hrefFor),
  ...(page !== totalPages
    ? [createPageItem(page, hrefFor, true)]
    : [])
]

const buildPaginationItems = (
  page,
  totalPages,
  perPage,
  extraParams = {}
) => {
  const extraQuery = buildExtraQuery(extraParams)

  const hrefFor = pageNumber =>
        `?page=${pageNumber}&perPage=${perPage}${extraQuery}`

  if (totalPages <= 4) {
    return buildAllPages(totalPages, page, hrefFor)
  }

  let items = [
    createPageItem(1, hrefFor, page === 1)
  ]

  if (page <= 4) {
    items = items.concat(
      buildStartPages(page, totalPages, hrefFor)
    )
  } else {
    items = items.concat(
      buildMiddlePages(page, totalPages, hrefFor)
    )
  }

  if (page > 4 && page < totalPages - 1) {
    items = items.concat([
      createPageItem(page + 1, hrefFor)
    ])
  }

  if (page < totalPages - 2) {
    items = items.concat([{ ellipsis: true }])
  }

  items = items.concat([
    createPageItem(
      totalPages,
      hrefFor,
      page === totalPages
    )
  ])

  return items
}

module.exports = buildPaginationItems
