jest.mock('../../../app/helpers', () => ({
  getSchemes: jest.fn(),
  groupHoldCategoriesByScheme: jest.fn(),
  filterAndPaginateHolds: jest.requireActual('../../../app/helpers/filter-and-paginate-holds').filterAndPaginateHolds
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

jest.mock('../../../app/helpers/bulk-fail-action', () => ({
  bulkFailAction: jest.fn()
}))

const { getSchemes, groupHoldCategoriesByScheme } = require('../../../app/helpers')
const { getHolds, getHoldCategories } = require('../../../app/holds')
const { postProcessing } = require('../../../app/api')
const { mapHoldCategoriesToRadios, handleBulkPost } = require('../../../app/hold')
const { bulkFailAction } = require('../../../app/helpers/bulk-fail-action')
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
  handleBulkPost.mockReset()
  bulkFailAction.mockReset()
  routes = require('../../../app/routes/holds')
})

const findRouteByPath = (path, method) => {
  return routes.find(r => r.path === path && (method ? r.method === method : true))
}

const makeH = () => {
  return {
    view: jest.fn((view, ctx) => {
      const resp = {
        view,
        ctx,
        code: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnThis()
      }
      return resp
    }),
    redirect: jest.fn(url => ({ redirect: url })),
    code: jest.fn().mockReturnThis(),
    takeover: jest.fn().mockReturnThis()
  }
}

describe('holds route methods', () => {
  test('GET manage handler returns manage view with query param', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.MANAGE, 'GET')
    const h = makeH()
    const req = { query: { holdAdded: 'true' } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.MANAGE)
    expect(res.ctx.holdAdded).toEqual('true')
  })

  test('GET add handler renders schemes, radios and selected scheme when holdCategoryId passed', async () => {
    const schemes = [{ schemeId: 1, name: 'S1' }]
    const paymentHoldCategories = [{ holdCategoryId: 2, name: 'Name', schemeName: 'S1' }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    mapHoldCategoriesToRadios.mockReturnValue([{ value: 2, text: 'Name' }])
    const route = findRouteByPath(HOLDS_ROUTES.ADD, 'GET')
    const h = makeH()
    const req = { query: { holdCategoryId: 2, frn: '123' } }
    const res = await route.options.handler(req, h)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(mapHoldCategoriesToRadios).toHaveBeenCalledWith(schemes, paymentHoldCategories, { valueKey: 'holdCategoryId', textKey: 'name' })
    expect(res.view).toEqual(HOLDS_VIEWS.ADD)
    expect(res.ctx.selectScheme).toEqual('S1')
    expect(res.ctx.frn).toEqual('123')
  })

  test('GET add handler when holdCategoryId passed but category not found sets no selectScheme', async () => {
    const schemes = [{ schemeId: 1, name: 'S1' }]
    const paymentHoldCategories = [{ holdCategoryId: 2, name: 'Name', schemeName: undefined }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    mapHoldCategoriesToRadios.mockReturnValue([{ value: 2, text: 'Name' }])
    const route = findRouteByPath(HOLDS_ROUTES.ADD, 'GET')
    const h = makeH()
    const req = { query: { holdCategoryId: 999, frn: '555' } }
    const res = await route.options.handler(req, h)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(res.view).toEqual(HOLDS_VIEWS.ADD)
    expect(res.ctx.selectScheme).toBeUndefined()
    expect(res.ctx.frn).toEqual('555')
  })

  test('POST add-confirm handler shows confirmation for selected category', async () => {
    const schemes = [{ name: 'SchemeA' }]
    const paymentHoldCategories = [{ holdCategoryId: 5, name: 'HoldA', schemeName: 'SchemeA' }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    const route = findRouteByPath(HOLDS_ROUTES.ADD_CONFIRM, 'POST')
    const h = makeH()
    const req = { payload: { holdCategoryId: 5, frn: '999' } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.ADD_CONFIRM)
    expect(res.ctx.holdCategoryName).toEqual('HoldA')
    expect(res.ctx.selectedScheme).toEqual('SchemeA')
    expect(res.ctx.frn).toEqual('999')
  })

  test('POST add-confirm handler when selected category not found returns confirmation view with undefined names', async () => {
    getHoldCategories.mockResolvedValue({ schemes: [], paymentHoldCategories: [] })
    const route = findRouteByPath(HOLDS_ROUTES.ADD_CONFIRM, 'POST')
    const h = makeH()
    const req = { payload: { holdCategoryId: 999, frn: '101' } }
    const res = await route.options.handler(req, h)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(res.view).toEqual(HOLDS_VIEWS.ADD_CONFIRM)
    expect(res.ctx.holdCategoryName).toBeUndefined()
    expect(res.ctx.selectedScheme).toBeUndefined()
    expect(res.ctx.frn).toEqual('101')
  })

  test('POST add-confirm validation failAction returns view with errors and takes over', async () => {
    getHoldCategories.mockResolvedValue({ schemes: [], paymentHoldCategories: [] })
    const route = findRouteByPath(HOLDS_ROUTES.ADD_CONFIRM, 'POST')
    const h = makeH()
    const fakeError = new Error('validation')
    const req = { payload: { frn: 'x', selectScheme: 'S' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(mapHoldCategoriesToRadios).toHaveBeenCalled()
    expect(out).toHaveProperty('takeover')
  })

  test('POST add handler calls postProcessing and redirects on success', async () => {
    postProcessing.mockResolvedValue()
    const route = findRouteByPath(HOLDS_ROUTES.ADD, 'POST')
    const h = makeH()
    const req = { payload: { holdCategoryId: 3, frn: '321' } }
    const res = await route.options.handler(req, h)
    expect(postProcessing).toHaveBeenCalledWith('/add-payment-hold', { holdCategoryId: 3, frn: '321' }, null)
    expect(res).toEqual({ redirect: `${HOLDS_ROUTES.MANAGE}?holdAdded=true` })
  })

  test('ADD POST validation failAction returns view with errors and takes over', async () => {
    getHoldCategories.mockResolvedValue({ schemes: [], paymentHoldCategories: [] })
    const route = findRouteByPath(HOLDS_ROUTES.ADD, 'POST')
    const h = makeH()
    const fakeError = new Error('validation')
    const req = { payload: { frn: 'x' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
    expect(out).toHaveProperty('takeover')
  })

  test('GET search handler renders search view with schemes and query', async () => {
    const schemes = [{ schemeId: 7, name: 'Sch' }]
    getSchemes.mockResolvedValue(schemes)
    const route = findRouteByPath(HOLDS_ROUTES.SEARCH, 'GET')
    const h = makeH()
    const req = { query: { frn: '55', schemeId: '7' } }
    const res = await route.options.handler(req, h)
    expect(getSchemes).toHaveBeenCalled()
    expect(res.view).toEqual(HOLDS_VIEWS.SEARCH)
    expect(res.ctx.frn).toEqual('55')
    expect(res.ctx.schemeId).toEqual('7')
  })

  test('POST holds handler filters by frn and schemeName', async () => {
    const holds = [
      { frn: '10', holdCategorySchemeName: 'A' },
      { frn: '20', holdCategorySchemeName: 'B' },
      { frn: '10', holdCategorySchemeName: 'B' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'POST')
    const h = makeH()
    const reqFRN = { payload: { frn: '10' } }
    const resFRN = await route.options.handler(reqFRN, h)
    expect(resFRN.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(resFRN.ctx.paymentHolds.length).toBe(2)
    const reqScheme = { payload: { name: 'B' } }
    const resScheme = await route.options.handler(reqScheme, h)
    expect(resScheme.ctx.paymentHolds.length).toBe(2)
  })

  test('POST holds handler filters by both schemeName and frn when both frn and name provided', async () => {
    const holds = [
      { frn: '10', holdCategorySchemeName: 'A' },
      { frn: '10', holdCategorySchemeName: 'B' },
      { frn: '20', holdCategorySchemeName: 'B' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'POST')
    const h = makeH()
    const reqBoth = { payload: { frn: '10', name: 'B' } }
    const resBoth = await route.options.handler(reqBoth, h)
    expect(resBoth.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(resBoth.ctx.paymentHolds.every(p => p.frn === '10')).toBeTruthy()
    expect(resBoth.ctx.paymentHolds.every(p => p.holdCategorySchemeName === 'B')).toBeTruthy()
    expect(resBoth.ctx.paymentHolds.length).toBe(1)
  })

  test('POST holds handler returns all results when no frn or name provided', async () => {
    const holds = [
      { frn: '10', holdCategorySchemeName: 'A' },
      { frn: '20', holdCategorySchemeName: 'B' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'POST')
    const h = makeH()
    const reqNone = { payload: {} }
    const resNone = await route.options.handler(reqNone, h)
    expect(resNone.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(resNone.ctx.paymentHolds.length).toBe(2)
    expect(resNone.ctx.numberOfHolds).toBe(2)
  })

  test('POST holds validation failAction returns search view with errors and takes over', async () => {
    getSchemes.mockResolvedValue([{ schemeId: 1, name: 'S' }])
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'POST')
    const h = makeH()
    const fakeError = new Error('v')
    const req = { payload: { frn: '1', schemeId: '2' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getSchemes).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
    expect(out).toHaveProperty('takeover')
  })

  test('GET holds results handler paginates using page and perPage query params', async () => {
    const holds = Array.from({ length: 150 }, (_, i) => ({ frn: String(i), holdCategorySchemeName: 'A' }))
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'GET')
    const h = makeH()
    const req = { query: { page: 2, perPage: 100 } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(res.ctx.numberOfHolds).toBe(150)
    expect(res.ctx.paymentHolds.length).toBe(50)
    expect(res.ctx.page).toBe(2)
    expect(res.ctx.perPage).toBe(100)
  })

  test('GET holds results handler filters by frn and schemeName from query', async () => {
    const holds = [
      { frn: '10', holdCategorySchemeName: 'A' },
      { frn: '20', holdCategorySchemeName: 'B' },
      { frn: '10', holdCategorySchemeName: 'B' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'GET')
    const h = makeH()
    const req = { query: { frn: '10', name: 'B', page: 1, perPage: 100 } }
    const res = await route.options.handler(req, h)
    expect(res.ctx.paymentHolds).toEqual([{ frn: '10', holdCategorySchemeName: 'B' }])
    expect(res.ctx.frn).toEqual('10')
    expect(res.ctx.schemeName).toEqual('B')
  })

  test('GET holds results validation failAction returns search view with errors and takes over', async () => {
    getSchemes.mockResolvedValue([{ schemeId: 1, name: 'S' }])
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'GET')
    const h = makeH()
    const fakeError = new Error('v')
    const req = { query: { perPage: '999' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getSchemes).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
    expect(out).toHaveProperty('takeover')
  })

  test('POST remove handler calls postProcessing and returns holds view with holdRemoved', async () => {
    postProcessing.mockResolvedValue()
    getHolds.mockResolvedValue([])
    const route = findRouteByPath(HOLDS_ROUTES.REMOVE, 'POST')
    const h = makeH()
    const req = { payload: { holdId: 1, frn: '222', name: 'SchemeX', holdCategoryName: 'XName' } }
    const res = await route.options.handler(req, h)
    expect(postProcessing).toHaveBeenCalledWith(HOLDS_ROUTES.REMOVE, { holdId: 1 })
    expect(res.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(res.ctx.holdRemoved).toBe(true)
    expect(res.ctx.holdCategoryName).toBe('XName')
  })

  test('POST remove handler filters payment holds correctly and sets holdRemoved', async () => {
    postProcessing.mockResolvedValue()
    const holds = [
      { frn: '10', holdCategorySchemeName: 'A' },
      { frn: '10', holdCategorySchemeName: 'B' },
      { frn: '20', holdCategorySchemeName: 'A' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.REMOVE, 'POST')
    const h = makeH()
    const req = { payload: { holdId: 2, frn: '10', name: undefined, holdCategoryName: 'Some' } }
    const res = await route.options.handler(req, h)
    expect(postProcessing).toHaveBeenCalledWith(HOLDS_ROUTES.REMOVE, { holdId: 2 })
    expect(res.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(res.ctx.paymentHolds.length).toBe(2)
    expect(res.ctx.holdRemoved).toBe(true)
  })

  test('GET bulk landing renders view with bulk query', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.BULK_LANDING, 'GET')
    const h = makeH()
    const req = { query: { bulk: 'done' } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.BULK_LANDING)
    expect(res.ctx.bulkStatus).toEqual('done')
  })

  test('GET bulk redirects to landing when invalid type', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.BULK, 'GET')
    const h = makeH()
    const req = { query: { type: 'invalid' } }
    const res = await route.options.handler(req, h)
    expect(res).toEqual({ redirect: HOLDS_ROUTES.BULK_LANDING })
  })

  test('GET bulk renders with radios when type valid', async () => {
    const paymentHoldCategories = [{ holdCategoryId: 1, name: 'A' }]
    const schemes = [{ schemeId: 9, name: 'S9' }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    mapHoldCategoriesToRadios.mockReturnValue([{ value: 1, text: 'A' }])
    const route = findRouteByPath(HOLDS_ROUTES.BULK, 'GET')
    const h = makeH()
    const req = { query: { type: 'add' } }
    const res = await route.options.handler(req, h)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(mapHoldCategoriesToRadios).toHaveBeenCalled()
    expect(res.view).toEqual(HOLDS_VIEWS.BULK)
    expect(res.ctx.type).toEqual('add')
  })

  test('POST bulk route uses handleBulkPost as top-level handler', () => {
    const route = findRouteByPath(HOLDS_ROUTES.BULK, 'POST')
    expect(route.handler).toBe(handleBulkPost)
  })

  test('POST bulk payload failAction delegates to bulkFailAction', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.BULK, 'POST')
    const h = makeH()
    const req = { payload: {} }
    const fakeError = new Error('boom')
    bulkFailAction.mockReturnValue({ delegated: true })
    const out = await route.options.payload.failAction(req, h, fakeError)
    expect(bulkFailAction).toHaveBeenCalledWith(req, h, fakeError)
    expect(out).toEqual({ delegated: true })
  })

  test('POST bulk validate failAction delegates to bulkFailAction', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.BULK, 'POST')
    const h = makeH()
    const req = { payload: {} }
    const fakeError = new Error('boom2')
    bulkFailAction.mockReturnValue({ delegatedValidate: true })
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(bulkFailAction).toHaveBeenCalledWith(req, h, fakeError)
    expect(out).toEqual({ delegatedValidate: true })
  })

  test('GET types handler renders organised categories', async () => {
    const organised = [{ scheme: 'S', categories: [] }]
    getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ name: 'A' }] })
    groupHoldCategoriesByScheme.mockReturnValue(organised)
    const route = findRouteByPath(HOLDS_ROUTES.TYPES, 'GET')
    const h = makeH()
    const req = {}
    const result = await route.options.handler(req, h)
    expect(result.view).toEqual(HOLDS_VIEWS.TYPES)
    expect(result.ctx).toEqual({
      paymentHoldCategories: organised,
      createdCategory: undefined,
      editedCategory: undefined,
      removedCategory: undefined,
      error: undefined
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
    expect(result.view).toEqual(HOLDS_VIEWS.ADD_TYPE)
    expect(result.ctx).toEqual({ schemes })
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

  test('ADD_TYPE validation failAction returns view with errors and BAD_REQUEST', async () => {
    getSchemes.mockResolvedValue([{ schemeId: 1, name: 'S' }])
    const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
    const h = makeH()
    const fakeError = new Error('v')
    const req = { payload: { schemeId: undefined, categoryName: '' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getSchemes).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
    expect(out).toHaveProperty('takeover')
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
    expect(result.view).toEqual(HOLDS_VIEWS.EDIT_TYPE)
    expect(result.ctx).toEqual({ schemeName: 'SchemeX', categoryName: 'Custom', holdCategoryId: 7 })
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

  test('EDIT_TYPE validation failAction returns view with errors and BAD_REQUEST', async () => {
    getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 20, name: 'X', schemeName: 'S' }] })
    const route = findRouteByPath(HOLDS_ROUTES.EDIT_TYPE, 'POST')
    const h = makeH()
    const fakeError = new Error('v')
    const req = { payload: { holdCategoryId: 20, categoryName: '' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
    expect(out).toHaveProperty('takeover')
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

  test('GET remove-type renders remove view for editable category', async () => {
    getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 13, name: 'ToRemove', schemeName: 'S' }] })
    const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE, 'GET')
    const h = makeH()
    const req = { query: { holdCategoryId: 13 } }
    const result = await route.options.handler(req, h)
    expect(result.view).toEqual(HOLDS_VIEWS.REMOVE_TYPE)
    expect(result.ctx).toEqual({ schemeName: 'S', categoryName: 'ToRemove', holdCategoryId: 13 })
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

  test('POST remove-type-api without holdCategoryId redirects to types', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE_API, 'POST')
    const h = makeH()
    const req = { payload: {} }
    const result = await route.options.handler(req, h)
    expect(result).toEqual({ redirect: HOLDS_ROUTES.TYPES })
  })

  test('POST remove-type-api redirects to types when category is mandatory', async () => {
    getHoldCategories.mockResolvedValue({ paymentHoldCategories: [{ holdCategoryId: 21, name: 'MANDATORY', schemeName: 'S' }] })
    const route = findRouteByPath(HOLDS_ROUTES.REMOVE_TYPE_API, 'POST')
    const h = makeH()
    const req = { payload: { holdCategoryId: 21 } }
    const result = await route.options.handler(req, h)
    expect(result).toEqual({ redirect: HOLDS_ROUTES.TYPES })
  })

  test('POST remove-confirm handler renders remove confirmation view with payload', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.REMOVE_CONFIRM, 'POST')
    const h = makeH()
    const req = { payload: { holdId: 123, frn: '999', holdCategoryName: 'CatName', schemeName: 'SchName' } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.REMOVE_CONFIRM)
    expect(res.ctx).toEqual({ holdId: 123, frn: '999', schemeName: 'SchName', holdCategoryName: 'CatName' })
  })

  test('POST holds handler filters by schemeName exact match', async () => {
    const holds = [
      { frn: '1', holdCategorySchemeName: 'Match' },
      { frn: '2', holdCategorySchemeName: 'Nope' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'POST')
    const h = makeH()
    const req = { payload: { name: 'Match' } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(res.ctx.paymentHolds).toEqual([{ frn: '1', holdCategorySchemeName: 'Match' }])
    expect(res.ctx.numberOfHolds).toBe(1)
  })

  test('POST holds handler filters when payload.name matches holdCategorySchemeName', async () => {
    const holds = [
      { frn: '100', holdCategorySchemeName: 'SchemeX' },
      { frn: '101', holdCategorySchemeName: 'SchemeY' },
      { frn: '102', holdCategorySchemeName: 'SchemeX' }
    ]
    getHolds.mockResolvedValue(holds)
    const route = findRouteByPath(HOLDS_ROUTES.HOLDS, 'POST')
    const h = makeH()
    const req = { payload: { name: 'SchemeX' } }
    const res = await route.options.handler(req, h)
    expect(res.view).toEqual(HOLDS_VIEWS.HOLDS)
    expect(res.ctx.paymentHolds).toEqual([{ frn: '100', holdCategorySchemeName: 'SchemeX' }, { frn: '102', holdCategorySchemeName: 'SchemeX' }])
    expect(res.ctx.numberOfHolds).toBe(2)
  })

  test('ADD_TYPE validation failAction returns view when categoryName is reserved', async () => {
    getSchemes.mockResolvedValue([{ schemeId: 1, name: 'S' }])
    const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
    const h = makeH()
    const fakeError = new Error('reserved')
    const req = { payload: { schemeId: 1, categoryName: 'MANDATORY' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getSchemes).toHaveBeenCalled()
    expect(out.ctx.errors).toBe(fakeError)
    expect(out.ctx.schemeId).toEqual(1)
    expect(out.ctx.categoryName).toEqual('MANDATORY')
    expect(out).toHaveProperty('takeover')
  })

  test('ADD_TYPE schema: missing schemeId produces "A scheme must be selected"', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
    const schema = route.options.validate.payload
    try {
      await schema.validateAsync({ schemeId: undefined, categoryName: 'New' })
      throw new Error('validation did not fail')
    } catch (err) {
      expect(err.details.some(d => d.message === 'A scheme must be selected')).toBeTruthy()
    }
  })

  test('ADD_TYPE schema: empty categoryName produces "Provide a hold type name"', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
    const schema = route.options.validate.payload
    try {
      await schema.validateAsync({ schemeId: 1, categoryName: '' })
      throw new Error('validation did not fail')
    } catch (err) {
      expect(err.details.some(d => d.message === 'Provide a hold type name')).toBeTruthy()
    }
  })

  test('ADD_TYPE schema: reserved categoryName produces reserved-name message', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
    const schema = route.options.validate.payload
    try {
      await schema.validateAsync({ schemeId: 1, categoryName: 'MANDATORY' })
      throw new Error('validation did not fail')
    } catch (err) {
      expect(err.details.some(d => d.message === 'This hold type name is reserved and cannot be used')).toBeTruthy()
    }
  })

  test('ADD_TYPE schema: non-integer schemeId produces "A scheme must be selected"', async () => {
    const route = findRouteByPath(HOLDS_ROUTES.ADD_TYPE, 'POST')
    const schema = route.options.validate.payload
    try {
      await schema.validateAsync({ schemeId: 'x', categoryName: 'Name' })
      throw new Error('validation did not fail')
    } catch (err) {
      expect(err.details.some(d => d.message === 'A scheme must be selected')).toBeTruthy()
    }
  })

  test('GET bulk handler sets selectScheme when holdCategoryId matches category with schemeName', async () => {
    const paymentHoldCategories = [{ holdCategoryId: '2', name: 'Name', schemeName: 'S1' }]
    const schemes = [{ schemeId: 1, name: 'S1' }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    mapHoldCategoriesToRadios.mockReturnValue([{ value: '2', text: 'Name' }])
    const route = findRouteByPath(HOLDS_ROUTES.BULK, 'GET')
    const h = makeH()
    const req = { query: { type: 'add', holdCategoryId: '2' } }
    const res = await route.options.handler(req, h)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(res.view).toEqual(HOLDS_VIEWS.BULK)
    expect(res.ctx.selectScheme).toEqual('S1')
    expect(res.ctx.selectHoldCategoryId).toEqual('2')
  })

  test('POST add-confirm validation failAction includes selectScheme from payload', async () => {
    getHoldCategories.mockResolvedValue({ schemes: [], paymentHoldCategories: [] })
    const route = findRouteByPath(HOLDS_ROUTES.ADD_CONFIRM, 'POST')
    const h = makeH()
    const fakeError = new Error('validation')
    const req = { payload: { frn: 'x', selectScheme: 'MyScheme', holdCategoryId: '42' } }
    const out = await route.options.validate.failAction(req, h, fakeError)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(out.ctx.selectScheme).toEqual('MyScheme')
    expect(out.ctx.selectHoldCategoryId).toEqual('42')
    expect(out).toHaveProperty('takeover')
  })
})
