const Joi = require('joi')
const schema = require('./schemas/holds/hold')
const searchSchema = require('./schemas/holds/hold-search')
const bulkSchema = require('./schemas/holds/bulk-hold')
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
const { getSchemes, groupHoldCategoriesByScheme } = require('../helpers')
const mandatoryHoldTypes = require('../constants/mandatory-hold-types')

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
        const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, { valueKey: 'holdCategoryId', textKey: 'name' })

        const frn = request.query?.frn
        const selectHoldCategoryId = request.query?.holdCategoryId
        let selectScheme
        if (selectHoldCategoryId) {
          const selectedCategory = paymentHoldCategories.find(c => String(c.holdCategoryId) === String(selectHoldCategoryId))
          if (selectedCategory?.schemeName) {
            selectScheme = selectedCategory.schemeName
          }
        }

        return h.view(HOLDS_VIEWS.ADD, { schemes, holdCategoryRadios, frn, selectScheme, selectHoldCategoryId })
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
          const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, { valueKey: 'holdCategoryId', textKey: 'name' })
          return h
            .view(HOLDS_VIEWS.ADD, {
              schemes,
              holdCategoryRadios,
              errors: error,
              frn: request.payload?.frn,
              selectHoldCategoryId: request.payload?.holdCategoryId,
              selectScheme: request.payload?.selectScheme
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
          frn: request.payload?.frn,
          selectedScheme: selectedScheme ? selectedScheme.name : undefined,
          holdCategoryId: request.payload?.holdCategoryId,
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

          const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, { valueKey: 'holdCategoryId', textKey: 'name' })

          const selectHoldCategoryId = request.payload?.holdCategoryId
          let selectScheme
          if (selectHoldCategoryId) {
            const selectedCategory = paymentHoldCategories.find(c => String(c.holdCategoryId) === String(selectHoldCategoryId))
            if (selectedCategory?.schemeName) {
              selectScheme = selectedCategory.schemeName
            }
          }

          return h
            .view(HOLDS_VIEWS.ADD, {
              holdCategoryRadios,
              errors: error,
              frn: request.payload?.frn,
              selectHoldCategoryId,
              selectScheme
            })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        await postProcessing(
          '/add-payment-hold',
          { holdCategoryId: request.payload?.holdCategoryId, frn: request.payload?.frn },
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
        let paymentHolds = await getHolds(undefined, undefined, false)
        if (frn) {
          paymentHolds = paymentHolds.filter(x => x.frn === String(frn))
        }
        if (schemeName) {
          paymentHolds = paymentHolds.filter(x => x.holdCategorySchemeName === schemeName)
        }
        return h.view(HOLDS_VIEWS.HOLDS, {
          paymentHolds,
          numberOfHolds: paymentHolds.length,
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
          filteredPaymentHolds = paymentHolds.filter(x => x.frn === String(frn))
        }
        if (schemeName) {
          filteredPaymentHolds = paymentHolds.filter(x => x.holdCategorySchemeName === schemeName)
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
    path: HOLDS_ROUTES.BULK_LANDING,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const bulkStatus = request.query?.bulk
        return h.view(HOLDS_VIEWS.BULK_LANDING, { bulkStatus })
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
        const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, { valueKey: 'holdCategoryId', textKey: 'name' })

        const selectHoldCategoryId = request.query?.holdCategoryId
        let selectScheme
        if (selectHoldCategoryId) {
          const selectedCategory = paymentHoldCategories.find(c => String(c.holdCategoryId) === String(selectHoldCategoryId))
          if (selectedCategory?.schemeName) {
            selectScheme = selectedCategory.schemeName
          }
        }

        return h.view(HOLDS_VIEWS.BULK, { holdCategoryRadios, type, selectScheme, selectHoldCategoryId })
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
  }, {
    method: 'GET',
    path: HOLDS_ROUTES.TYPES,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { paymentHoldCategories } = await getHoldCategories()
        const organisedHoldCategories = groupHoldCategoriesByScheme(paymentHoldCategories)

        return h.view(HOLDS_VIEWS.TYPES, {
          paymentHoldCategories: organisedHoldCategories,
          createdCategory: request.query?.createdCategory,
          editedCategory: request.query?.editedCategory,
          removedCategory: request.query?.removedCategory,
          error: request.query?.error
        })
      }
    }
  }, {
    method: 'GET',
    path: HOLDS_ROUTES.ADD_TYPE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const schemes = await getSchemes()
        return h.view(HOLDS_VIEWS.ADD_TYPE, { schemes })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.ADD_TYPE,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: Joi.object({
          schemeId: Joi.number()
            .integer()
            .required()
            .error(errors => {
              errors.forEach(err => {
                err.message = 'A scheme must be selected'
              })
              return errors
            }),
          categoryName: Joi.string()
            .required()
            .invalid(...mandatoryHoldTypes)
            .error(errors => {
              errors.forEach(err => {
                if (err.code === 'any.invalid') {
                  err.message = 'This hold type name is reserved and cannot be used'
                } else {
                  err.message = 'Provide a hold type name'
                }
              })
              return errors
            })
        }),
        failAction: async (request, h, error) => {
          const schemes = await getSchemes()
          return h.view(HOLDS_VIEWS.ADD_TYPE, {
            schemes,
            errors: error,
            schemeId: request.payload?.schemeId,
            categoryName: request.payload?.categoryName
          })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const schemeId = request.payload?.schemeId
        const categoryName = request.payload?.categoryName
        await postProcessing(
          '/add-hold-type',
          { categoryName, schemeId },
          null
        )
        return h.redirect(`${HOLDS_ROUTES.TYPES}?createdCategory=${encodeURIComponent(categoryName)}`)
      }
    }
  }, {
    method: 'GET',
    path: HOLDS_ROUTES.EDIT_TYPE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const holdCategoryId = request.query?.holdCategoryId
        if (!holdCategoryId) {
          return h.redirect(HOLDS_ROUTES.TYPES)
        }

        const { paymentHoldCategories } = await getHoldCategories()
        const category = paymentHoldCategories.find(s => String(s.holdCategoryId) === String(holdCategoryId))
        if (mandatoryHoldTypes.includes(category.name)) {
          return h.redirect(HOLDS_ROUTES.TYPES)
        }
        return h.view(HOLDS_VIEWS.EDIT_TYPE, { schemeName: category.schemeName, categoryName: category.name, holdCategoryId })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.EDIT_TYPE,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: Joi.object({
          holdCategoryId: Joi.number()
            .integer()
            .required()
            .error(errors => {
              errors.forEach(err => {
                err.message = 'A hold category must be selected to edit'
              })
              return errors
            }),
          categoryName: Joi.string()
            .required()
            .invalid(...mandatoryHoldTypes)
            .error(errors => {
              errors.forEach(err => {
                if (err.code === 'any.invalid') {
                  err.message = 'This hold type name is reserved and cannot be used'
                } else {
                  err.message = 'Provide a hold type name'
                }
              })
              return errors
            })
        }),
        failAction: async (request, h, error) => {
          const holdCategoryId = request.payload?.holdCategoryId
          const { paymentHoldCategories } = await getHoldCategories()
          const category = paymentHoldCategories.find(s => String(s.holdCategoryId) === String(holdCategoryId))
          return h.view(HOLDS_VIEWS.EDIT_TYPE, {
            errors: error,
            schemeName: category.schemeName,
            categoryName: request.payload.categoryName
          })
            .code(HTTP_STATUS.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const holdCategoryId = request.payload?.holdCategoryId
        const categoryName = request.payload?.categoryName
        await postProcessing(
          '/edit-hold-type',
          { categoryName, holdCategoryId },
          null
        )
        return h.redirect(`${HOLDS_ROUTES.TYPES}?editedCategory=${encodeURIComponent(categoryName)}`)
      }
    }
  }, {
    method: 'GET',
    path: HOLDS_ROUTES.REMOVE_TYPE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const holdCategoryId = request.query?.holdCategoryId
        if (!holdCategoryId) {
          return h.redirect(HOLDS_ROUTES.TYPES)
        }

        const { paymentHoldCategories } = await getHoldCategories()
        const category = paymentHoldCategories.find(s => String(s.holdCategoryId) === String(holdCategoryId))
        if (mandatoryHoldTypes.includes(category.name)) {
          return h.redirect(HOLDS_ROUTES.TYPES)
        }
        return h.view(HOLDS_VIEWS.REMOVE_TYPE, { schemeName: category.schemeName, categoryName: category.name, holdCategoryId })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.REMOVE_TYPE_API,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const holdCategoryId = request.payload?.holdCategoryId
        if (!holdCategoryId) {
          return h.redirect(HOLDS_ROUTES.TYPES)
        }

        const { paymentHoldCategories } = await getHoldCategories()
        const category = paymentHoldCategories.find(s => String(s.holdCategoryId) === String(holdCategoryId))
        if (mandatoryHoldTypes.includes(category.name)) {
          return h.redirect(HOLDS_ROUTES.TYPES)
        }

        try {
          await postProcessing(HOLDS_ROUTES.REMOVE_TYPE_API, { holdCategoryId: request.payload?.holdCategoryId })
          return h.redirect(`${HOLDS_ROUTES.TYPES}?removedCategory=${encodeURIComponent(category.name)}`)
        } catch (error) {
          console.error(`A hold category could not be removed: ${error.message}`)
          return h.redirect(`${HOLDS_VIEWS.TYPES}?error=true`)
        }
      }
    }
  }
]
