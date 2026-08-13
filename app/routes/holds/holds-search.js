const searchSchema = require('../schemas/holds/hold-search')
const resultsQuerySchema = require('../schemas/holds/hold-results-query')
const HTTP_STATUS = require('../../constants/http-status-codes')
const HOLDS_VIEWS = require('../../constants/holds-views')
const HOLDS_ROUTES = require('../../constants/holds-routes')
const { applicationAdmin, holdAdmin } = require('../../auth/permissions')
const { getHolds } = require('../../holds')
const { getSchemes, filterAndPaginateHolds } = require('../../helpers')
const { parsePaginationParams, redirectWithFilters } = require('../../helpers/list-view')
const { buildHoldsViewModel } = require('../../hold/view-models')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin] }
const DEFAULT_PER_PAGE = 100

module.exports = [
  {
    method: 'GET',
    path: HOLDS_ROUTES.SEARCH,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const schemes = await getSchemes()
        const frn = request.query?.frn
        const schemeId = request.query?.schemeId
        return h.view(HOLDS_VIEWS.SEARCH, { schemes, frn, schemeId })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.HOLDS,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: searchSchema,
        failAction: async (request, h, errors) => {
          const frn = request.payload?.frn
          const schemeId = request.payload?.schemeId
          const schemes = await getSchemes()
          return h
            .view(HOLDS_VIEWS.SEARCH, { schemes, frn, schemeId, errors })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const frn = request.payload?.frn
        const schemeName = request.payload?.name
        return redirectWithFilters(h, HOLDS_ROUTES.HOLDS, DEFAULT_PER_PAGE, {
          frn,
          name: schemeName
        })
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.HOLDS,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        query: resultsQuerySchema,
        failAction: async (_request, h, errors) => {
          const schemes = await getSchemes()
          return h
            .view(HOLDS_VIEWS.SEARCH, { schemes, errors })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const frn = request.query?.frn
        const schemeName = request.query?.name
        const { page, perPage } = parsePaginationParams(request.query, DEFAULT_PER_PAGE)
        const allHolds = await getHolds(undefined, undefined, false)
        const results = filterAndPaginateHolds(allHolds, {
          frn,
          schemeName,
          page,
          perPage
        })
        return h.view(HOLDS_VIEWS.HOLDS, buildHoldsViewModel({
          results,
          page,
          perPage,
          frn,
          schemeName
        }))
      }
    }
  }
]
