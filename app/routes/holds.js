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
const { handleBulkPost, mapHoldCategoriesToRadios } = require('../hold')
const { PAYMENT_HOLDS_LINKS } = require('../constants/section-links')
const { getSchemes } = require('../helpers')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin] }

module.exports = [
  {
    method: 'GET',
    path: HOLDS_ROUTES.MANAGE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const cards = [...PAYMENT_HOLDS_LINKS]
        cards.shift()
        const holdAdded = request.query.holdAdded
        return h.view(HOLDS_VIEWS.MANAGE, { cards, holdAdded })
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { schemes, paymentHoldCategories } = await getHoldCategories()

        const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, {
          valueKey: 'holdCategoryId',
          textKey: 'name'
        })

        const frn = request.query.frn
        const holdCategoryId = request.query.holdCategoryId
        let selectScheme
        if (holdCategoryId) {
          const selectedCategory = paymentHoldCategories.find(c => String(c.holdCategoryId) === String(holdCategoryId))
          if (selectedCategory?.schemeName) {
            selectScheme = selectedCategory.schemeName
          }
        }

        return h.view(HOLDS_VIEWS.ADD, { schemes, holdCategoryRadios, frn, selectScheme })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.ADD_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          const { schemes, paymentHoldCategories } = await getHoldCategories()
          const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, {
            valueKey: 'holdCategoryId',
            textKey: 'name'
          })
          return h
            .view(HOLDS_VIEWS.ADD, {
              schemes,
              holdCategoryRadios,
              errors: error,
              frn: request.payload.frn,
              selectScheme: request.payload.selectScheme
            })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { schemes, paymentHoldCategories } = await getHoldCategories()
        const selectedCategory = paymentHoldCategories.find(c => String(c.holdCategoryId) === String(request.payload.holdCategoryId))
        const selectedScheme = schemes.find(scheme => String(scheme.name) === String(selectedCategory ? selectedCategory.schemeName : undefined))
        return h.view(HOLDS_VIEWS.ADD_CONFIRM, {
          frn: request.payload.frn,
          selectedScheme: selectedScheme ? selectedScheme.name : undefined,
          holdCategoryId: request.payload.holdCategoryId,
          holdCategoryName: selectedCategory ? selectedCategory.name : undefined
        })
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

          const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, {
            valueKey: 'holdCategoryId',
            textKey: 'name'
          })

          return h
            .view(HOLDS_VIEWS.ADD, {
              holdCategoryRadios,
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
        return h.redirect(`${HOLDS_ROUTES.MANAGE}?holdAdded=true`)
      }
    }
  }, {
    method: 'GET',
    path: HOLDS_ROUTES.SEARCH,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const schemes = await getSchemes()
        const frn = request.query.frn
        const schemeId = request.query.schemeId
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
        const frn = request.payload.frn
        const schemeName = request.payload.name
        const paymentHolds = await getHolds(undefined, undefined, false)
        let filteredPaymentHolds = []
        if (frn) {
          filteredPaymentHolds = paymentHolds.filter(
            x => x.frn === String(frn)
          )
        }
        if (schemeName) {
          filteredPaymentHolds = paymentHolds.filter(
            x => x.holdCategorySchemeName === schemeName
          )
        }
        return h.view(HOLDS_VIEWS.HOLDS, {
          paymentHolds: filteredPaymentHolds,
          numberOfHolds: filteredPaymentHolds.length,
          frn,
          schemeName
        })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.REMOVE_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { holdId, frn, holdCategoryName, schemeName } = request.payload
        return h.view(HOLDS_VIEWS.REMOVE_CONFIRM, { holdId, frn, schemeName, holdCategoryName })
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
        const frn = request.payload?.frn
        const schemeName = request.payload?.name
        const holdCategoryName = request.payload?.holdCategoryName
        const paymentHolds = await getHolds(undefined, undefined, false)
        let filteredPaymentHolds = []
        if (frn) {
          filteredPaymentHolds = paymentHolds.filter(
            x => x.frn === String(frn)
          )
        }
        if (schemeName) {
          filteredPaymentHolds = paymentHolds.filter(
            x => x.holdCategorySchemeName === schemeName
          )
        }
        return h.view(HOLDS_VIEWS.HOLDS, {
          paymentHolds: filteredPaymentHolds,
          numberOfHolds: filteredPaymentHolds.length,
          frn,
          schemeName,
          holdRemoved: true,
          holdCategoryName
        })
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

        const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, {
          valueKey: 'holdCategoryId',
          textKey: 'name'
        })

        return h.view(HOLDS_VIEWS.BULK, { holdCategoryRadios })
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
