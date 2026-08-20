const bulkSchema = require('../schemas/holds/bulk-hold')
const HOLDS_VIEWS = require('../../constants/holds-views')
const HOLDS_ROUTES = require('../../constants/holds-routes')
const { MAX_BYTES } = require('../../constants/payload-sizes')
const { bulkFailAction } = require('../../helpers/bulk-fail-action')
const { applicationAdmin, holdAdmin } = require('../../auth/permissions')
const { getHoldCategories } = require('../../holds')
const { handleBulkPost, mapHoldCategoriesToRadios } = require('../../hold')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin] }

module.exports = [
  {
    method: 'GET',
    path: HOLDS_ROUTES.BULK_LANDING,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        return h.view(HOLDS_VIEWS.BULK_LANDING, {
          bulkStatus: request.query?.bulk
        })
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.BULK,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const type = request.query?.type
        if (!type || !['add', 'remove'].includes(type)) {
          return h.redirect(HOLDS_ROUTES.BULK_LANDING)
        }
        const { schemes, paymentHoldCategories } = await getHoldCategories()
        const holdCategoryRadios = mapHoldCategoriesToRadios(
          schemes,
          paymentHoldCategories,
          { valueKey: 'holdCategoryId', textKey: 'name' }
        )
        const selectHoldCategoryId = request.query?.holdCategoryId
        const selectedCategory = selectHoldCategoryId
          ? paymentHoldCategories.find(category =>
            String(category.holdCategoryId) === String(selectHoldCategoryId)
          )
          : undefined
        return h.view(HOLDS_VIEWS.BULK, {
          holdCategoryRadios,
          type,
          selectScheme: selectedCategory?.schemeName,
          selectHoldCategoryId
        })
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
        failAction: async (request, h, error) => bulkFailAction(request, h, error)
      },
      validate: {
        payload: bulkSchema,
        failAction: async (request, h, error) => bulkFailAction(request, h, error)
      }
    }
  }
]
