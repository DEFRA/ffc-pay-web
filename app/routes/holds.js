const ViewModel = require('./models/search')
const schema = require('./schemas/hold')
const searchSchema = require('./schemas/hold-search')
const bulkSchema = require('./schemas/bulk-hold')
const HTTP_STATUS = require('../constants/http-status-codes')
const HOLDS_VIEWS = require('../constants/holds-views')
const HOLDS_ROUTES = require('../constants/holds-routes')
const { MAX_BYTES } = require('../constants/payload-sizes')
const { bulkFailAction } = require('../helpers/bulk-fail-action')
const { postProcessing } = require('../api')
const { applicationAdmin, holdAdmin } = require('../auth/permissions')
const { getHolds, getHoldCategories } = require('../holds')
const { handleBulkPost } = require('../hold')
const searchLabelText = 'Search for a hold by FRN number'

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin] }

module.exports = [
  {
    method: 'GET',
    path: HOLDS_ROUTES.HOLDS,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const page = Number.parseInt(request.query.page) || 1
        const perPage = Number.parseInt(request.query.perPage || 100)
        const paymentHolds = await getHolds(page, perPage)
        return h.view(HOLDS_VIEWS.HOLDS, {
          paymentHolds,
          page,
          perPage,
          ...new ViewModel(searchLabelText)
        })
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
        failAction: async (request, h, error) => {
          const paymentHolds = await getHolds()
          return h
            .view(HOLDS_VIEWS.HOLDS, {
              paymentHolds,
              ...new ViewModel(searchLabelText, request.payload.frn, error)
            })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const frn = request.payload.frn
        const paymentHolds = await getHolds(undefined, undefined, false)
        const filteredPaymentHolds = paymentHolds.filter(
          x => x.frn === String(frn)
        )

        if (filteredPaymentHolds.length) {
          return h.view(HOLDS_VIEWS.HOLDS, {
            paymentHolds: filteredPaymentHolds,
            ...new ViewModel(searchLabelText, frn)
          })
        }

        return h
          .view(
            HOLDS_VIEWS.HOLDS,
            new ViewModel(searchLabelText, frn, {
              message: 'No holds match the FRN provided.'
            })
          )
          .code(HTTP_STATUS.BAD_REQUEST)
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const { schemes, paymentHoldCategories } = await getHoldCategories()
        return h.view(HOLDS_VIEWS.ADD, { schemes, paymentHoldCategories })
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.BULK,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const { schemes, paymentHoldCategories } = await getHoldCategories()
        return h.view(HOLDS_VIEWS.BULK, { schemes, paymentHoldCategories })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          const { schemes, paymentHoldCategories } = await getHoldCategories()
          return h
            .view(HOLDS_VIEWS.ADD, {
              schemes,
              paymentHoldCategories,
              errors: error,
              frn: request.payload.frn
            })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        await postProcessing(
          HOLDS_ROUTES.ADD,
          {
            holdCategoryId: request.payload.holdCategoryId,
            frn: request.payload.frn
          },
          null
        )
        return h.redirect(HOLDS_ROUTES.HOLDS)
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.REMOVE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        await postProcessing(HOLDS_ROUTES.REMOVE, { holdId: request.payload.holdId })
        return h.redirect('/')
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.BULK,
    handler: handleBulkPost,
    options: {
      auth: AUTH_SCOPE,
      payload: {
        output: 'file',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: MAX_BYTES,
        multipart: true,
        failAction: async (request, h, error) => {
          return bulkFailAction(request, h, error)
        }
      },
      validate: {
        payload: bulkSchema,
        failAction: async (request, h, error) => {
          return bulkFailAction(request, h, error)
        }
      }
    }
  }
]
