const buildPaginationItems = require('./build-pagination-items')

const defaultPage = 1

const parsePaginationParams = (query, defaultPerPage) => ({
  page: Number.parseInt(query.page) > 0 ? Number.parseInt(query.page) : defaultPage,
  perPage: Number.parseInt(query.perPage) > 0 ? Number.parseInt(query.perPage) : defaultPerPage
})

// Wraps a fetch+shape function with the pagination bookkeeping every list view needs.
// fetchAndShape receives { page, perPage, ...filters } and must return { data, count }.
const withPagination = (fetchAndShape) => async ({ page, perPage, ...filters }) => {
  const { data, count } = await fetchAndShape({ page, perPage, ...filters })
  const totalPages = Math.ceil(count / perPage)
  const paginationItems = buildPaginationItems(page, totalPages, perPage, filters)
  return { data, totalPages, paginationItems }
}

// POST/redirect/GET so the search filters become part of the URL - this means pagination
// on the results, and reloading/bookmarking the page, both keep working with the filters
// applied, instead of only ever showing an unpaginated in-memory-filtered result for the
// single POST that triggered the search.
const redirectWithFilters = (h, path, defaultPerPage, filters = {}) => {
  const params = new URLSearchParams({ page: defaultPage, perPage: defaultPerPage })
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })
  return h.redirect(`${path}?${params.toString()}`)
}

module.exports = {
  defaultPage,
  parsePaginationParams,
  withPagination,
  redirectWithFilters
}
