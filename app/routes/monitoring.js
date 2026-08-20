const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const {
  getPaymentsByFrn,
  getPaymentsByCorrelationId,
  getPaymentsByBatch
} = require('../payments')
const buildPaginationItems = require('../helpers/build-pagination-items')
const { parsePaginationParams } = require('../helpers/list-view')

const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
const DEFAULT_PER_PAGE = 100

const buildFrnViewModel = ({ allPayments, frn, page, perPage }) => {
  const numberOfPayments = allPayments.length
  const totalPages = Math.ceil(numberOfPayments / perPage)
  const selectedPage = totalPages > 0 && page > totalPages ? totalPages : page
  const startIndex = (selectedPage - 1) * perPage
  const payments = allPayments.slice(startIndex, startIndex + perPage)
  const paginationItems = buildPaginationItems(
    selectedPage,
    totalPages,
    perPage,
    { frn }
  )
  const extraQuery = frn
    ? `&frn=${encodeURIComponent(frn)}`
    : ''

  return {
    frn,
    payments,
    page: selectedPage,
    perPage,
    numberOfPayments,
    totalPages,
    paginationItems,
    extraQuery
  }
}

const buildBatchViewModel = ({ allPayments, batch, page, perPage }) => {
  const numberOfPayments = allPayments.length

  const totalPages = Math.ceil(numberOfPayments / perPage)

  const selectedPage =
    totalPages > 0 && page > totalPages
      ? totalPages
      : page

  const startIndex = (selectedPage - 1) * perPage

  const payments = allPayments.slice(
    startIndex,
    startIndex + perPage
  )

  const paginationItems = buildPaginationItems(
    selectedPage,
    totalPages,
    perPage,
    { batch }
  )

  return {
    batch,
    payments,
    page: selectedPage,
    perPage,
    numberOfPayments,
    totalPages,
    paginationItems
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/monitoring',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const error = request.query.error
      const errorField = request.query.errorField
      if (error) {
        return h.view('monitoring/monitoring', {
          error: 'Enter a FRN or batch name',
          errorField
        })
      }
      return h.view('monitoring/monitoring')
    }
  },
  {
    method: 'GET',
    path: '/monitoring/payments/frn',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const frn = request.query.frn
      if (!frn) {
        return h.redirect('/monitoring?error=true&errorField=frn')
      }

      const { page, perPage } = parsePaginationParams(
        request.query,
        DEFAULT_PER_PAGE
      )
      const allPayments = await getPaymentsByFrn(frn)

      return h.view('monitoring/frn', buildFrnViewModel({
        allPayments,
        frn,
        page,
        perPage
      }))
    }
  },
  {
    method: 'GET',
    path: '/monitoring/payments/correlation-id',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const correlationId = request.query.correlationId
      const events = await getPaymentsByCorrelationId(correlationId)
      return h.view('monitoring/correlation-id', { correlationId, events })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/batch/name',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const batch = request.query.batch

      if (!batch) {
        return h.redirect('/monitoring?error=true&errorField=batch')
      }

      const { page, perPage } = parsePaginationParams(
        request.query,
        DEFAULT_PER_PAGE
      )

      const allPayments = await getPaymentsByBatch(batch)

      return h.view(
        'monitoring/batch',
        buildBatchViewModel({
          allPayments,
          batch,
          page,
          perPage
        })
      )
    }
  }
]
