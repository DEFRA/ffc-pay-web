jest.mock('../../../app/helpers', () => ({
  getSchemes: jest.fn(),
  groupHoldCategoriesByScheme: jest.fn()
}))

jest.mock('../../../app/holds', () => ({
  getHolds: jest.fn(),
  getHoldCategories: jest.fn()
}))

jest.mock('../../../app/api', () => ({
  postProcessing: jest.fn()
}))

jest.mock('../../../app/hold', () => ({
  mapHoldCategoriesToRadios: jest.fn(),
  handleBulkPost: jest.fn()
}))

jest.mock('../../../app/constants/mandatory-hold-types', () => ['MANDATORY'])

const { getSchemes, groupHoldCategoriesByScheme } = require('../../../app/helpers')
const { getHolds, getHoldCategories } = require('../../../app/holds')
const { postProcessing } = require('../../../app/api')
const { mapHoldCategoriesToRadios } = require('../../../app/hold')
const HOLDS_ROUTES = require('../../../app/constants/holds-routes')
const HOLDS_VIEWS = require('../../../app/constants/holds-views')

let routes

beforeEach(() => {
  jest.clearAllMocks()
  getSchemes.mockReset()
  groupHoldCategoriesByScheme.mockReset()
  getHolds.mockReset()
  getHoldCategories.mockReset()
  postProcessing.mockReset()
  mapHoldCategoriesToRadios.mockReset()
  routes = require('../../../app/routes/holds')
})

function findRouteByPath(path, method) {
  return routes.find(r => r.path === path && (method ? r.method === method : true))
}

function makeH() {
  return {
    view: jest.fn((view, ctx) => ({ view, ctx })),
    redirect: jest.fn(url => ({ redirect: url })),
    code: jest.fn().mockReturnThis(),
    takeover: jest.fn().mockReturnThis()
  }
}

test('GET types handler renders organised categories', async () => {
  const organised = [{ scheme: 'S', categories: [] }]
  getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ name: 'A' }] })
  groupHoldCategoriesByScheme.mockReturnValue(organised)
  const route = findRouteByPath(HOLDS_ROUTES.TYPES, 'GET')
  const h = makeH()
  const req = {}
  const result = await route.options.handler(req, h)
  expect(result).toEqual({
    view: HOLDS_VIEWS.TYPES, ctx: {
      paymentHoldCategories: organised,
      createdCategory: undefined,
      editedCategory: undefined,
      removedCategory: undefined,
      error: undefined
    }
  })
})

test('GET add-type handler renders schemes', async () => {
  const schemes = [{ schemeId: 1, name: 'S1' }]
  getSchemes.mockResolvedValue(schemes)
  const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'GET')
  const h = makeH()
  const req = {}
  const result = await route.options.handler(req, h)
  expect(getSchemes).toHaveBeenCalled()
  expect(result).toEqual({ view: HOLDS_VIEWS.ADD_TYPE, ctx: { schemes } })
})

test('POST add-type handler calls postProcessing and redirects on success', async () => {
  postProcessing.mockResolvedValue()
  const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
  const h = makeH()
  const req = { payload: { categoryName: 'New', schemeId: 2 } }
  const outcome = await route.options.handler(req, h)
  expect(postProcessing).toHaveBeenCalledWith('/add-hold-type', { categoryName: 'New', schemeId: 2 }, null)
  expect(outcome).toEqual({ redirect: `${HOLDS_ROUTES.TYPES}?createdCategory=${encodeURIComponent('New')}` })
})

test('GET edit-type without id redirects to types', async () => {
  const route = findRouteByPath(HOLDS_ROUTES.EDIT_TYPE, 'GET')
  const h = makeH()
  const req = { query: {} }
  const result = await route.options.handler(req, h)
  expect(result).toEqual({ redirect: HOLDS_ROUTES.TYPES })
})

test('GET edit-type redirects when category is mandatory', async () => {
  getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 5, name: 'MANDATORY', schemeName: 'S' }] })
  const route = findRouteByPath(HOLDS_ROUTES.EDIT_TYPE, 'GET')
  const h = makeH()
  const req = { query: { holdCategoryId: 5 } }
  const result = await route.options.handler(req, h)
  expect(result).toEqual({ redirect: HOLDS_ROUTES.TYPES })
})

test('GET edit-type renders view for editable category', async () => {
  getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 7, name: 'Custom', schemeName: 'SchemeX' }] })
  const route = findRouteByPath(HOLDS_ROUTES.EDIT_TYPE, 'GET')
  const h = makeH()
  const req = { query: { holdCategoryId: 7 } }
  const result = await route.options.handler(req, h)
  expect(result).toEqual({ view: HOLDS_VIEWS.EDIT_TYPE, ctx: { schemeName: 'SchemeX', categoryName: 'Custom', holdCategoryId: 7 } })
})

test('POST edit-type calls postProcessing and redirects on success', async () => {
  postProcessing.mockResolvedValue()
  const route = findRouteByPath(HOLDS_ROUTES.EDIT_TYPE, 'POST')
  const h = makeH()
  const req = { payload: { categoryName: 'Updated', holdCategoryId: 9 } }
  const result = await route.options.handler(req, h)
  expect(postProcessing).toHaveBeenCalledWith('/edit-hold-type', { categoryName: 'Updated', holdCategoryId: 9 }, null)
  expect(result).toEqual({ redirect: `${HOLDS_ROUTES.TYPES}?editedCategory=${encodeURIComponent('Updated')}` })
})

test('GET remove-type without id redirects to types', async () => {
  const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE, 'GET')
  const h = makeH()
  const req = { query: {} }
  const result = await route.options.handler(req, h)
  expect(result).toEqual({ redirect: HOLDS_ROUTES.TYPES })
})

test('GET remove-type redirects when category is mandatory', async () => {
  getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 11, name: 'MANDATORY', schemeName: 'S' }] })
  const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE, 'GET')
  const h = makeH()
  const req = { query: { holdCategoryId: 11 } }
  const result = await route.options.handler(req, h)
  expect(result).toEqual({ redirect: HOLDS_ROUTES.TYPES })
})

test('POST remove-type-api removes and redirects on success', async () => {
  getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 13, name: 'ToRemove', schemeName: 'S' }] })
  postProcessing.mockResolvedValue()
  const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE_API, 'POST')
  const h = makeH()
  const req = { payload: { holdCategoryId: 13 } }
  const result = await route.options.handler(req, h)
  expect(postProcessing).toHaveBeenCalledWith(HOLDS_ROUTES.REMOVE_TYPE_API, { holdCategoryId: 13 })
  expect(result).toEqual({ redirect: `${HOLDS_ROUTES.TYPES}?removedCategory=${encodeURIComponent('ToRemove')}` })
})

test('POST remove-type-api handles postProcessing error and redirects to error view', async () => {
  getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 15, name: 'ToFail', schemeName: 'S' }] })
  postProcessing.mockRejectedValue(new Error('boom'))
  const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE_API, 'POST')
  const h = makeH()
  const req = { payload: { holdCategoryId: 15 } }
  const result = await route.options.handler(req, h)
  expect(result).toEqual({ redirect: `${HOLDS_VIEWS.TYPES}?error=true` })
})
