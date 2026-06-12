jest.mock('../../../../app/holds', () => ({
  getHolds: jest.fn(),
  getHoldCategories: jest.fn()
}))
jest.mock('../../../../app/api', () => ({
  postProcessing: jest.fn()
}))
jest.mock('../../../../app/hold', () => ({
  handleBulkPost: jest.fn(),
  mapHoldCategoriesToRadios: jest.fn()
}))
jest.mock('../../../../app/helpers', () => ({
  ...jest.requireActual('../../../../app/helpers'),
  getSchemes: jest.fn(),
  groupHoldCategoriesByScheme: jest.fn()
}))
jest.mock('../../../../app/helpers/bulk-fail-action', () => ({
  bulkFailAction: jest.fn()
}))

const { getHolds, getHoldCategories } = require('../../../../app/holds')
const { postProcessing } = require('../../../../app/api')
const { handleBulkPost, mapHoldCategoriesToRadios } = require('../../../../app/hold')
const { groupHoldCategoriesByScheme } = require('../../../../app/helpers')
const HOLDS_ROUTES = require('../../../../app/constants/holds-routes')
const HOLDS_VIEWS = require('../../../../app/constants/holds-views')
const { holdAdmin } = require('../../../../app/auth/permissions')

let createServer
let server

describe('Holds routes (integration narrow)', () => {
  jest.mock('../../../../app/auth')

  createServer = require('../../../../app/server')

  const auth = {
    strategy: 'session-auth',
    credentials: {
      scope: [holdAdmin],
      account: { name: 'TestUser' }
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET add route returns 200 and renders hold categories', async () => {
    const schemes = [{ name: 'Scheme X' }]
    const paymentHoldCategories = [{ holdCategoryId: 1, name: 'Cat A', schemeName: 'Scheme X' }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    mapHoldCategoriesToRadios.mockReturnValue([{ value: 1, text: 'Cat A' }])

    const options = { method: 'GET', url: `${HOLDS_ROUTES.ADD}`, auth }
    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(getHoldCategories).toHaveBeenCalled()
    expect(response.payload).toContain('Create a payment hold')
    expect(response.payload).toContain('FRN (Firm reference number)')
  })

  test('POST add-confirm handler returns the add-confirm view with selected values', async () => {
    const schemes = [{ name: 'Scheme X' }]
    const paymentHoldCategories = [{ holdCategoryId: 2, name: 'Cat B', schemeName: 'Scheme X' }]
    getHoldCategories.mockResolvedValue({ schemes, paymentHoldCategories })
    const routes = require('../../../../app/routes/holds')
    const route = routes.find(r => r.method === 'POST' && r.path === HOLDS_ROUTES.ADD_CONFIRM)
    const handler = route.handler || route.options?.handler
    const h = { view: jest.fn() }
    const request = { payload: { holdCategoryId: '2', frn: '12345' } }

    await handler(request, h)

    expect(getHoldCategories).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith(HOLDS_VIEWS.ADD_CONFIRM, expect.objectContaining({
      frn: '12345',
      holdCategoryId: '2',
      holdCategoryName: 'Cat B'
    }))
  })

  test('POST add handler calls postProcessing and redirects to manage', async () => {
    postProcessing.mockResolvedValue()
    const routes = require('../../../../app/routes/holds')
    const route = routes.find(r => r.method === 'POST' && r.path === HOLDS_ROUTES.ADD)
    const handler = route.handler || route.options?.handler
    const h = { redirect: jest.fn() }
    const request = { payload: { holdCategoryId: '5', frn: '999' } }

    await handler(request, h)

    expect(postProcessing).toHaveBeenCalledWith(
      '/add-payment-hold',
      { holdCategoryId: '5', frn: '999' },
      null
    )
    expect(h.redirect).toHaveBeenCalledWith(`${HOLDS_ROUTES.MANAGE}?holdAdded=true`)
  })

  test('POST holds search handler filters by frn and scheme name', async () => {
    const paymentHolds = [
      { frn: '111', holdCategorySchemeName: 'S1' },
      { frn: '222', holdCategorySchemeName: 'S2' }
    ]
    getHolds.mockResolvedValue(paymentHolds)

    const routes = require('../../../../app/routes/holds')
    const route = routes.find(r => r.method === 'POST' && r.path === HOLDS_ROUTES.HOLDS)
    const handler = route.handler || route.options?.handler
    const h = { view: jest.fn() }
    const request = { payload: { frn: '111', name: undefined } }

    await handler(request, h)

    expect(getHolds).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith(HOLDS_VIEWS.HOLDS, expect.objectContaining({
      paymentHolds: expect.arrayContaining([expect.objectContaining({ frn: '111' })]),
      numberOfHolds: 1,
      frn: '111'
    }))
  })

  test('GET bulk without valid type redirects to bulk landing', async () => {
    const options = { method: 'GET', url: `${HOLDS_ROUTES.BULK}?type=invalid`, auth }
    const response = await server.inject(options)

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(HOLDS_ROUTES.BULK_LANDING)
  })

  test('POST bulk route uses the handleBulkPost handler', () => {
    const routes = require('../../../../app/routes/holds')
    const route = routes.find(r => r.method === 'POST' && r.path === HOLDS_ROUTES.BULK)
    expect(route.handler).toBe(handleBulkPost)
  })

  test('GET types returns organised hold categories view', async () => {
    const paymentHoldCategories = [{ holdCategoryId: 10, name: 'Cat Z', schemeName: 'S-Z' }]
    getHoldCategories.mockResolvedValue({ paymentHoldCategories })
    groupHoldCategoriesByScheme.mockReturnValue({ 'S-Z': [{ name: 'Cat Z' }] })

    const options = { method: 'GET', url: HOLDS_ROUTES.TYPES, auth }
    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(groupHoldCategoriesByScheme).toHaveBeenCalledWith(paymentHoldCategories)
    expect(response.payload).toContain('Manage payment hold types')
  })

  test('POST add-type calls postProcessing and redirects to types with createdCategory', async () => {
    postProcessing.mockResolvedValue()
    const routes = require('../../../../app/routes/holds')
    const route = routes.find(r => r.method === 'POST' && r.path === HOLDS_ROUTES.ADD_TYPE)
    const handler = route.handler || route.options?.handler
    const h = { redirect: jest.fn() }
    const request = { payload: { categoryName: 'New Cat', schemeId: '7' } }

    await handler(request, h)

    expect(postProcessing).toHaveBeenCalledWith('/add-hold-type', { categoryName: 'New Cat', schemeId: '7' }, null)
    expect(h.redirect).toHaveBeenCalledWith(`${HOLDS_ROUTES.TYPES}?createdCategory=${encodeURIComponent('New Cat')}`)
  })
})
