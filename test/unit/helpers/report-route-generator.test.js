const { createFormRoute, createDownloadRoute } = require('../../../app/helpers/report-route-generator')
const { holdAdmin, schemeAdmin, dataView } = require('../../../app/auth/permissions')

jest.mock('../../../app/helpers/get-view', () => ({
  getView: jest.fn((returnViewRoute, h) => `view:${returnViewRoute}`)
}))
jest.mock('../../../app/helpers/render-error-page', () => ({
  renderErrorPage: jest.fn((viewOnFail, request, h, err) => `error:${viewOnFail}`)
}))

const { getView } = require('../../../app/helpers/get-view')
const { renderErrorPage } = require('../../../app/helpers/render-error-page')

const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

describe('report-route-generator', () => {
  describe('createFormRoute', () => {
    const path = '/form'
    const returnViewRoute = 'viewRoute'
    let route

    beforeEach(() => {
      route = createFormRoute(path, returnViewRoute)
    })

    test('should return a route object with method GET, correct path and auth scope', () => {
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
    })

    test('handler should call getView with provided returnViewRoute and h', async () => {
      const h = {}
      const request = {}
      const outcome = await route.options.handler(request, h)
      expect(getView).toHaveBeenCalledWith(returnViewRoute, h)
      expect(outcome).toBe(`view:${returnViewRoute}`)
    })
  })

  describe('createDownloadRoute', () => {
    const path = '/download'
    const viewOnFail = 'failView'
    const validationSchema = { param: 'string' }
    const requestHandler = jest.fn(async (req, h) => 'downloaded')
    let route

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should return a route object with GET method, provided path, auth scope, and no validation if schema is undefined', () => {
      route = createDownloadRoute(path, viewOnFail, undefined, requestHandler)
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeUndefined()
    })

    test('should include validation when validationSchema is provided and log the event', () => {
      console.log = jest.fn()
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeDefined()
      expect(route.options.validate.query).toEqual(validationSchema)
      expect(console.log).toHaveBeenCalledWith('validationSchema exists. ' + path)
    })

    test('failAction should call renderErrorPage and return its value', async () => {
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      const fakeRequest = { query: {} }
      const h = {}
      const fakeError = new Error('fail')
      const result = await route.options.validate.failAction(fakeRequest, h, fakeError)
      expect(renderErrorPage).toHaveBeenCalledWith(viewOnFail, fakeRequest, h, fakeError)
      expect(result).toBe(`error:${viewOnFail}`)
    })
  })
})
