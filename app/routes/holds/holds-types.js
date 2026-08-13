const Joi = require('joi')
const HOLDS_VIEWS = require('../../constants/holds-views')
const HOLDS_ROUTES = require('../../constants/holds-routes')
const HTTP_STATUS = require('../../constants/http-status-codes')
const { postProcessing } = require('../../api')
const { applicationAdmin, holdAdmin } = require('../../auth/permissions')
const { getHoldCategories } = require('../../holds')
const { getSchemes, groupHoldCategoriesByScheme } = require('../../helpers')
const mandatoryHoldTypes = require('../../constants/mandatory-hold-types')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin] }

const categoryNameSchema = Joi.string()
  .required()
  .invalid(...mandatoryHoldTypes)
  .error(errors => {
    errors.forEach(error => {
      error.message = error.code === 'any.invalid'
        ? 'This hold type name is reserved and cannot be used'
        : 'Provide a hold type name'
    })
    return errors
  })

const addTypeSchema = Joi.object({
  schemeId: Joi.number()
    .integer()
    .required()
    .error(errors => {
      errors.forEach(error => {
        error.message = 'A scheme must be selected'
      })
      return errors
    }),
  categoryName: categoryNameSchema
})

const editTypeSchema = Joi.object({
  holdCategoryId: Joi.number()
    .integer()
    .required()
    .error(errors => {
      errors.forEach(error => {
        error.message = 'A hold category must be selected to edit'
      })
      return errors
    }),
  categoryName: categoryNameSchema
})

const getEditableCategory = async holdCategoryId => {
  const { paymentHoldCategories } = await getHoldCategories()
  return paymentHoldCategories.find(category =>
    String(category.holdCategoryId) === String(holdCategoryId)
  )
}

module.exports = [
  {
    method: 'GET',
    path: HOLDS_ROUTES.TYPES,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { paymentHoldCategories } = await getHoldCategories()
        return h.view(HOLDS_VIEWS.TYPES, {
          paymentHoldCategories: groupHoldCategoriesByScheme(paymentHoldCategories),
          createdCategory: request.query?.createdCategory,
          editedCategory: request.query?.editedCategory,
          removedCategory: request.query?.removedCategory,
          error: request.query?.error
        })
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.ADD_TYPE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => h.view(HOLDS_VIEWS.ADD_TYPE, {
        schemes: await getSchemes()
      })
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.ADD_TYPE,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: addTypeSchema,
        failAction: async (request, h, error) => h
          .view(HOLDS_VIEWS.ADD_TYPE, {
            schemes: await getSchemes(),
            errors: error,
            schemeId: request.payload?.schemeId,
            categoryName: request.payload?.categoryName
          })
          .code(HTTP_STATUS.BAD_REQUEST)
          .takeover()
      },
      handler: async (request, h) => {
        const schemeId = request.payload?.schemeId
        const categoryName = request.payload?.categoryName
        await postProcessing('/add-hold-type', { categoryName, schemeId }, null)
        return h.redirect(`${HOLDS_ROUTES.TYPES}?createdCategory=${encodeURIComponent(categoryName)}`)
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.EDIT_TYPE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const holdCategoryId = request.query?.holdCategoryId
        if (!holdCategoryId) return h.redirect(HOLDS_ROUTES.TYPES)
        const category = await getEditableCategory(holdCategoryId)
        if (mandatoryHoldTypes.includes(category.name)) return h.redirect(HOLDS_ROUTES.TYPES)
        return h.view(HOLDS_VIEWS.EDIT_TYPE, {
          schemeName: category.schemeName,
          categoryName: category.name,
          holdCategoryId
        })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.EDIT_TYPE,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: editTypeSchema,
        failAction: async (request, h, error) => {
          const category = await getEditableCategory(request.payload?.holdCategoryId)
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
        await postProcessing('/edit-hold-type', { categoryName, holdCategoryId }, null)
        return h.redirect(`${HOLDS_ROUTES.TYPES}?editedCategory=${encodeURIComponent(categoryName)}`)
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.REMOVE_TYPE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const holdCategoryId = request.query?.holdCategoryId
        if (!holdCategoryId) return h.redirect(HOLDS_ROUTES.TYPES)
        const category = await getEditableCategory(holdCategoryId)
        if (mandatoryHoldTypes.includes(category.name)) return h.redirect(HOLDS_ROUTES.TYPES)
        return h.view(HOLDS_VIEWS.REMOVE_TYPE, {
          schemeName: category.schemeName,
          categoryName: category.name,
          holdCategoryId
        })
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
        if (!holdCategoryId) return h.redirect(HOLDS_ROUTES.TYPES)
        const category = await getEditableCategory(holdCategoryId)
        if (mandatoryHoldTypes.includes(category.name)) return h.redirect(HOLDS_ROUTES.TYPES)
        try {
          await postProcessing(HOLDS_ROUTES.REMOVE_TYPE_API, { holdCategoryId })
          return h.redirect(`${HOLDS_ROUTES.TYPES}?removedCategory=${encodeURIComponent(category.name)}`)
        } catch (error) {
          console.error(`A hold category could not be removed: ${error.message}`)
          return h.redirect(`${HOLDS_VIEWS.TYPES}?error=true`)
        }
      }
    }
  }
]
