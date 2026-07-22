const { applicationAdmin, closureAdmin } = require('../auth/permissions')
const schema = require('./schemas/closure/closure')
const bulkSchema = require('./schemas/closure/bulk-closure')
const removeConfirmSchema = require('./schemas/closure/remove-confirm')
const { postRetention, getRetentionData } = require('../api')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../constants/payload-sizes')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { handleBulkClosureError } = require('../closure/handle-bulk-closure-error')
const { handleBulkClosure } = require('../closure/handle-bulk-closure')
const CLOSURES_VIEWS = require('../constants/closures-views')
const CLOSURES_ROUTES = require('../constants/closures-routes')
const { AGREEMENT_CLOSURES_LINKS } = require('../constants/section-links')
const { getClosures } = require('../closure')
const { getSchemes } = require('../helpers')
const { getRetentionExtractDownloadStreamAndDeleteAfter } = require('../storage')

const AUTH_SCOPE = { scope: [applicationAdmin, closureAdmin] }
const defaultPage = 1
const defaultPageSize = 2500

module.exports = [
  {
    method: 'GET',
    path: CLOSURES_ROUTES.MANAGE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const cards = [...AGREEMENT_CLOSURES_LINKS]
        cards.shift()
        const closureAdded = request.query?.closureAdded
        return h.view(CLOSURES_VIEWS.MANAGE, { cards, closureAdded })
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.SEARCH,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const page = Number(request.query.page || defaultPage)
        const pageSize = Number(request.query.pageSize || defaultPageSize)
        const frnAgreement = request.query.frnAgreement || null
        const schemeId = request.query.schemeId || null

        const isSearch = Boolean(frnAgreement || schemeId)

        const [{ closures, count }, schemes] = await Promise.all([
          getClosures({
            page,
            pageSize,
            frnAgreement,
            schemeId
          }),
          getSchemes()
        ])

        const totalPages = isSearch
          ? 1
          : Math.ceil(count / pageSize)

        return h.view(CLOSURES_VIEWS.SEARCH, {
          closures,
          schemes,
          page,
          pageSize,
          frnAgreement,
          schemeId,
          isSearch,
          hasPreviousPage: !isSearch && page > 1,
          hasNextPage: !isSearch && page < totalPages,
          closureRemoved: request.query?.closureRemoved
        })
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const schemes = await getSchemes()
        return h.view(CLOSURES_VIEWS.ADD, {
          schemes,
          frn: request.query?.frn,
          agreement: request.query?.agreement,
          schemeId: request.query?.schemeId,
          day: request.query?.day,
          month: request.query?.month,
          year: request.query?.year
        })
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURES_ROUTES.ADD_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          const schemes = await getSchemes()
          return h
            .view(CLOSURES_VIEWS.ADD, {
              errors: error,
              schemes,
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              schemeId: request.payload.schemeId,
              day: request.payload.day,
              month: request.payload.month,
              year: request.payload.year
            })
            .code(BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const schemes = await getSchemes()
        const selectedScheme = schemes.find(scheme => String(scheme.schemeId) === String(request.payload.schemeId))
        return h.view(CLOSURES_VIEWS.ADD_CONFIRM, {
          frn: request.payload?.frn,
          agreement: request.payload.agreement,
          schemeId: request.payload.schemeId,
          schemeName: selectedScheme?.name,
          day: request.payload.day,
          month: request.payload.month,
          year: request.payload.year
        })
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURES_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          return h
            .view(CLOSURES_VIEWS.ADD, {
              errors: error,
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              schemeId: request.payload.schemeId,
              day: request.payload.day,
              month: request.payload.month,
              year: request.payload.year
            })
            .code(BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        let day = request.payload.day.toString()
        if (day.length !== 2) {
          day = `0${request.payload.day}`
        }
        let month = request.payload.month.toString()
        if (month.length !== 2) {
          month = `0${request.payload.month}`
        }
        const date = `${request.payload.year}-${month}-${day}T00:00:00`

        const user = request.auth?.credentials.account
        const addedBy = user?.name || user?.username || user?.email

        await postRetention(
          CLOSURES_ROUTES.ADD,
          {
            frn: request.payload.frn,
            agreementNumber: request.payload.agreement,
            schemeId: request.payload.schemeId,
            endDate: date,
            addedBy
          },
          null
        )
        return h.redirect(`${CLOSURES_ROUTES.MANAGE}?closureAdded=single`)
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.BULK,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        return h.view(CLOSURES_VIEWS.BULK)
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURES_ROUTES.BULK,
    handler: handleBulkClosure,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: bulkSchema,
        failAction: async (request, h, error) => {
          const crumb = request.payload?.crumb ?? request.state.crumb
          return handleBulkClosureError(h, error, crumb)
        }
      },
      payload: {
        output: 'file',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: MAX_BYTES,
        multipart: true,
        failAction: async (request, h, _error) => {
          const crumb = request.payload?.crumb ?? request.state.crumb
          return handleBulkClosureError(h, `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`, crumb)
        }
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.REMOVE_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        query: removeConfirmSchema,
        failAction: (_request, _h, error) => {
          throw error
        }
      },
      handler: async (request, h) => {
        const {
          retentionDataId,
          frn,
          agreementNumber,
          schemeName
        } = request.query

        return h.view(CLOSURES_VIEWS.REMOVE_CONFIRM, {
          retentionDataId,
          frn,
          agreementNumber,
          schemeName
        })
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURES_ROUTES.REMOVE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        await postRetention('/closure/remove', { retentionDataId: request.payload.retentionDataId })
        return h.redirect(`${CLOSURES_ROUTES.SEARCH}?closureRemoved=true`)
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.EXTRACT,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const response = await getRetentionData(CLOSURES_ROUTES.EXTRACT)
        const { filename } = response.payload
        const { stream } = await getRetentionExtractDownloadStreamAndDeleteAfter(filename)

        return h.response(stream)
          .type('text/csv')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .header('Cache-Control', 'no-store')
      }
    }
  }
]
