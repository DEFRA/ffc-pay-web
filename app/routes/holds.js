const ViewModel = require('./models/search')
const schema = require('./schemas/hold')
const searchSchema = require('./schemas/hold-search')
const bulkSchema = require('./schemas/bulk-hold')
const HTTP_STATUS = require('../constants/http-status')
const { MAX_BYTES } = require('../constants/payload-sizes')
const { bulkFailAction } = require('../helpers/bulk-fail-action')
const { post } = require('../api')
const { holdAdmin } = require('../auth/permissions')
const { getHolds, getHoldCategories } = require('../holds')
const { handleBulkPost } = require('../hold')
const searchLabelText = 'Search for a hold by FRN number'

const ROUTES = {
  HOLDS: '/payment-holds',
  ADD: '/add-payment-hold',
  BULK: '/payment-holds/bulk',
  REMOVE: '/remove-payment-hold'
}

const VIEWS = {
  HOLDS: 'payment-holds',
  ADD: 'add-payment-hold',
  BULK: 'payment-holds/bulk',
  REMOVE: 'remove-payment-hold'
}

module.exports = [
  {
    method: 'GET',
    path: ROUTES.HOLDS,
    options: {
      auth: { scope: [holdAdmin] },
      handler: async (request, h) => {
        const page = parseInt(request.query.page) || 1
        const perPage = parseInt(request.query.perPage || 100)
        const paymentHolds = await getHolds(page, perPage)
        return h.view(VIEWS.HOLDS, {
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
    path: ROUTES.HOLDS,
    options: {
      auth: { scope: [holdAdmin] },
      validate: {
        payload: searchSchema,
        failAction: async (request, h, error) => {
          const paymentHolds = await getHolds()
          return h
            .view(VIEWS.HOLDS, {
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
          return h.view(VIEWS.HOLDS, {
            paymentHolds: filteredPaymentHolds,
            ...new ViewModel(searchLabelText, frn)
          })
        }

        return h
          .view(
            VIEWS.HOLDS,
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
    path: ROUTES.ADD,
    options: {
      auth: { scope: [holdAdmin] },
      handler: async (_request, h) => {
        const { schemes, paymentHoldCategories } = await getHoldCategories()
        return h.view(VIEWS.ADD, { schemes, paymentHoldCategories })
      }
    }
  },
  {
    method: 'GET',
    path: ROUTES.BULK,
    options: {
      auth: { scope: [holdAdmin] },
      handler: async (_request, h) => {
        const { schemes, paymentHoldCategories } = await getHoldCategories()
        return h.view(VIEWS.BULK, { schemes, paymentHoldCategories })
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.ADD,
    options: {
      auth: { scope: [holdAdmin] },
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          const { schemes, paymentHoldCategories } = await getHoldCategories()
          return h
            .view(VIEWS.ADD, {
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
        await post(
          ROUTES.ADD,
          {
            holdCategoryId: request.payload.holdCategoryId,
            frn: request.payload.frn
          },
          null
        )
        return h.redirect(ROUTES.HOLDS)
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.REMOVE,
    options: {
      auth: { scope: [holdAdmin] },
      handler: async (request, h) => {
        await post(ROUTES.REMOVE, { holdId: request.payload.holdId })
        return h.redirect('/')
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.BULK,
    handler: handleBulkPost,
    options: {
      auth: { scope: [holdAdmin] },
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
