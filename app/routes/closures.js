const { applicationAdmin, closureAdmin } = require('../auth/permissions')
const schema = require('./schemas/closure')
const bulkSchema = require('./schemas/bulk-closure')
const { postProcessing, postRetention } = require('../api')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../constants/payload-sizes')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { handleBulkClosureError } = require('../closure/handle-bulk-closure-error')
const { handleBulkClosure } = require('../closure/handle-bulk-closure')

const CLOSURES_VIEWS = require('../constants/closures-views')
const CLOSURES_ROUTES = require('../constants/closures-routes')
const { AGREEMENT_CLOSURES_LINKS } = require('../constants/section-links')
const { getClosures } = require('../closure')
const { getSchemes } = require('../helpers')
const { SFI } = require('../constants/schemes')

const AUTH_SCOPE = { scope: [applicationAdmin, closureAdmin] }

module.exports = [
  {
    method: 'GET',
    path: CLOSURES_ROUTES.MANAGE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const cards = [...AGREEMENT_CLOSURES_LINKS]
        cards.shift()
        const closureAdded = request.query.closureAdded
        return h.view(CLOSURES_VIEWS.MANAGE, { cards, closureAdded })
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.UPDATE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const closures = await getClosures()
        return h.view(CLOSURES_VIEWS.UPDATE, { closures })
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const schemes = await getSchemes()
        return h.view(CLOSURES_VIEWS.ADD, { schemes })
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
        await postRetention(
          CLOSURES_ROUTES.ADD,
          {
            frn: request.payload.frn,
            agreement: request.payload.agreement,
            schemeId: request.payload.schemeId,
            date
          },
          null
        )
        if (request.payload.schemeId === SFI) {
          await postProcessing(
            CLOSURES_ROUTES.ADD,
            {
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              date
            },
            null
          )
        }
        return h.redirect(CLOSURES_ROUTES.MANAGE)
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
    method: 'POST',
    path: CLOSURES_ROUTES.REMOVE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        await postProcessing('/closure/remove', { closedId: request.payload.closedId })
        return h.redirect(CLOSURES_ROUTES.MANAGE)
      }
    }
  }
]
