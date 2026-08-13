const schema = require('../schemas/holds/hold')
const HTTP_STATUS = require('../../constants/http-status-codes')
const HOLDS_VIEWS = require('../../constants/holds-views')
const HOLDS_ROUTES = require('../../constants/holds-routes')
const { postProcessing } = require('../../api')
const { applicationAdmin, holdAdmin } = require('../../auth/permissions')
const { getHolds, getHoldCategories } = require('../../holds')
const { mapHoldCategoriesToRadios } = require('../../hold')
const { PAYMENT_HOLDS_LINKS } = require('../../constants/section-links')
const { filterAndPaginateHolds } = require('../../helpers')
const { parsePaginationParams } = require('../../helpers/list-view')
const { buildHoldsViewModel } = require('../../hold/view-models')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin] }
const DEFAULT_PER_PAGE = 100

const getAddViewData = async (values = {}) => {
  const { schemes, paymentHoldCategories } = await getHoldCategories()
  const holdCategoryRadios = mapHoldCategoriesToRadios(
    schemes,
    paymentHoldCategories,
    { valueKey: 'holdCategoryId', textKey: 'name' }
  )
  const selectHoldCategoryId = values.selectHoldCategoryId
  const selectedCategory = selectHoldCategoryId
    ? paymentHoldCategories.find(category => String(category.holdCategoryId) === String(selectHoldCategoryId))
    : undefined

  return {
    schemes,
    paymentHoldCategories,
    holdCategoryRadios,
    selectScheme: selectedCategory?.schemeName
  }
}

module.exports = [
  {
    method: 'GET',
    path: HOLDS_ROUTES.MANAGE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const cards = [...PAYMENT_HOLDS_LINKS]
        cards.shift()
        return h.view(HOLDS_VIEWS.MANAGE, {
          cards,
          holdAdded: request.query.holdAdded
        })
      }
    }
  },
  {
    method: 'GET',
    path: HOLDS_ROUTES.ADD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const frn = request.query?.frn
        const selectHoldCategoryId = request.query?.holdCategoryId
        const { schemes, holdCategoryRadios, selectScheme } = await getAddViewData({
          selectHoldCategoryId
        })
        return h.view(HOLDS_VIEWS.ADD, {
          schemes,
          holdCategoryRadios,
          frn,
          selectScheme,
          selectHoldCategoryId
        })
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
          const { schemes, holdCategoryRadios } = await getAddViewData()
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
        const selectedCategory = paymentHoldCategories.find(category =>
          String(category.holdCategoryId) === String(request.payload.holdCategoryId)
        )
        const selectedScheme = schemes.find(scheme =>
          String(scheme.name) === String(selectedCategory?.schemeName)
        )
        return h.view(HOLDS_VIEWS.ADD_CONFIRM, {
          frn: request.payload?.frn,
          selectedScheme: selectedScheme?.name,
          holdCategoryId: request.payload?.holdCategoryId,
          holdCategoryName: selectedCategory?.name
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
          const selectHoldCategoryId = request.payload?.holdCategoryId
          const { holdCategoryRadios, selectScheme } = await getAddViewData({
            selectHoldCategoryId
          })
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
        await postProcessing('/add-payment-hold', {
          holdCategoryId: request.payload?.holdCategoryId,
          frn: request.payload?.frn
        }, null)
        return h.redirect(`${HOLDS_ROUTES.MANAGE}?holdAdded=true`)
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.REMOVE_CONFIRM,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { holdId, frn, holdCategoryName, schemeName, page, perPage } = request.payload
        return h.view(HOLDS_VIEWS.REMOVE_CONFIRM, {
          holdId,
          frn,
          schemeName,
          holdCategoryName,
          page,
          perPage
        })
      }
    }
  },
  {
    method: 'POST',
    path: HOLDS_ROUTES.REMOVE,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        await postProcessing(HOLDS_ROUTES.REMOVE, {
          holdId: request.payload.holdId
        })
        const frn = request.payload?.frn
        const schemeName = request.payload?.schemeName
        const holdCategoryName = request.payload?.holdCategoryName
        const { page, perPage } = parsePaginationParams(request.payload, DEFAULT_PER_PAGE)
        const allHolds = await getHolds(undefined, undefined, false)
        let results = filterAndPaginateHolds(allHolds, {
          frn,
          schemeName,
          page,
          perPage
        })
        const totalPages = Math.ceil(results.numberOfHolds / perPage)
        const selectedPage = totalPages > 0 && page > totalPages ? totalPages : page
        if (selectedPage !== page) {
          results = filterAndPaginateHolds(allHolds, {
            frn,
            schemeName,
            page: selectedPage,
            perPage
          })
        }
        return h.view(HOLDS_VIEWS.HOLDS, {
          ...buildHoldsViewModel({
            results,
            page: selectedPage,
            perPage,
            frn,
            schemeName
          }),
          holdRemoved: true,
          holdCategoryName
        })
      }
    }
  }
]
