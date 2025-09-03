const { closureAdmin } = require('../auth/permissions')
const schema = require('./schemas/closure')
const bulkSchema = require('./schemas/bulk-closure')
const { post } = require('../api')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../constants/payload-sizes')
const { handleBulkClosureError } = require('../closure/handle-bulk-closure-error')
const { handleBulkClosure } = require('../closure/handle-bulk-closure')
const CLOSURES_VIEWS = require('../constants/closures-views')
const CLOSURES_ROUTES = require('../constants/closures-routes')

const HTTP = {
  BAD_REQUEST: 400
}

module.exports = [
  {
    method: 'GET',
    path: CLOSURES_ROUTES.ADD,
    options: {
      auth: { scope: [closureAdmin] },
      handler: async (_request, h) => {
        return h.view(CLOSURES_VIEWS.ADD)
      }
    }
  },
  {
    method: 'GET',
    path: CLOSURES_ROUTES.BULK,
    options: {
      auth: { scope: [closureAdmin] },
      handler: async (_request, h) => {
        return h.view(CLOSURES_VIEWS.BULK)
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURES_ROUTES.ADD,
    options: {
      auth: { scope: [closureAdmin] },
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          return h
            .view(CLOSURES_VIEWS.ADD, {
              errors: error,
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              day: request.payload.day,
              month: request.payload.month,
              year: request.payload.year
            })
            .code(HTTP.BAD_REQUEST)
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
        await postProcessing(
          CLOSURES_ROUTES.ADD,
          {
            frn: request.payload.frn,
            agreement: request.payload.agreement,
            date
          },
          null
        )
        return h.redirect(CLOSURES_ROUTES.BASE)
      }
    }
  },
  {
    method: 'POST',
    path: CLOSURES_ROUTES.BULK,
    handler: handleBulkClosure,
    options: {
      auth: { scope: [closureAdmin] },
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
  }
]
