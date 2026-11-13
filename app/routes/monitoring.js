const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const {
  getPaymentsByFrn,
  getPaymentsByCorrelationId,
  getPaymentsByBatch,
  getPaymentsByDate
} = require('../payments')
const buildPaginationItems = require('../helpers/build-pagination-items')
const { parsePaginationParams } = require('../helpers/list-view')
const { getSchemes } = require('../helpers')
const monitoringDateSchema = require('./schemas/monitoring-date-schema')
const { BAD_REQUEST } = require('../constants/http-status-codes')

const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
const DEFAULT_PER_PAGE = 100
const MONITORING_BY_DATE_VIEW = 'monitoring/monitoring-by-date'

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
  }, {
    method: 'GET',
    path: '/monitoring-by-date',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (_request, h) => {
      const schemes = getSchemes()
      return h.view(MONITORING_BY_DATE_VIEW, {
        schemes
      })
    }
  }, {
    method: 'POST',
    path: '/monitoring-by-date',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const payload = request.payload || {}
      const { value, error } = monitoringDateSchema.validate(payload, {
        abortEarly: false
      })

      if (error) {
        const fieldErrorNames = {
          schemeId: 'schemeIdError',
          day: 'dayError',
          month: 'monthError',
          year: 'yearError'
        }
        const fieldErrors = {}

        for (const detail of error.details) {
          const field = detail.path[0]
          const errorName = fieldErrorNames[field] || 'dateError'
          fieldErrors[errorName] = detail.message
        }

        return h.view(MONITORING_BY_DATE_VIEW, {
          schemes: getSchemes(),
          ...payload,
          ...fieldErrors
        }).code(BAD_REQUEST)
      }

      const { schemeId, day, month, year } = value
      return h.redirect(
        `/monitoring/date?schemeId=${encodeURIComponent(schemeId)}&day=${encodeURIComponent(day)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
      )
    }
  }, {
    method: 'GET',
    path: '/monitoring/date',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const { value, error } = monitoringDateSchema.validate(request.query, {
        abortEarly: false
      })

      if (error) {
        const fieldErrorNames = {
          schemeId: 'schemeIdError',
          day: 'dayError',
          month: 'monthError',
          year: 'yearError'
        }
        const fieldErrors = {}

        for (const detail of error.details) {
          const field = detail.path[0]
          const errorName = fieldErrorNames[field] || 'dateError'
          fieldErrors[errorName] = detail.message
        }

        return h.view(MONITORING_BY_DATE_VIEW, {
          schemes: getSchemes(),
          ...request.query,
          ...fieldErrors
        }).code(BAD_REQUEST)
      }

      const events = await getPaymentsByDate(value.schemeId, value.day, value.month, value.year)
      return h.view('monitoring/date', {
        ...value,
        events
      })
    }
  }
]
