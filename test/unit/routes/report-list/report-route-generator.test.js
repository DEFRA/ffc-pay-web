const { createFormRoute, createDownloadRoute } = require('../../../../app/helpers/report-route-generator')
const { holdAdmin, schemeAdmin, dataView } = require('../../../../app/auth/permissions')

jest.mock('../../../../app/helpers/get-view', () => ({
  getView: jest.fn((returnViewRoute, h) => `view:${returnViewRoute}`)
}))
jest.mock('../../../../app/helpers/render-error-page', () => ({
  renderErrorPage: jest.fn((viewOnFail, request, h, err) => `error:${viewOnFail}`)
}))

const { getView } = require('../../../../app/helpers/get-view')
const { renderErrorPage } = require('../../../../app/helpers/render-error-page')

const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

describe('report-route-generator', () => {
  describe('createFormRoute', () => {
    const path = '/form'
    const returnViewRoute = 'someView'

    let route

    beforeEach(() => {
      route = createFormRoute(path, returnViewRoute)
    })

    test('should return a route object with method GET and provided path', () => {
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
    })

    test('should set auth scope correctly', () => {
      expect(route.options.auth).toEqual(AUTH_SCOPE)
    })

    test('handler should call getView with given returnViewRoute and h', async () => {
      const h = { response: jest.fn() }
      const request = {}
      const result = await route.options.handler(request, h)
      expect(getView).toHaveBeenCalledWith(returnViewRoute, h)
      expect(result).toBe(`view:${returnViewRoute}`)
    })
  })

  describe('createDownloadRoute', () => {
    const path = '/download'
    const viewOnFail = 'errorView'
    const validationSchema = { foo: 'bar' }
    const requestHandler = jest.fn(async (req, h) => 'handled')
    let route

    beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}))

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should return a route object with method GET and provided path, without validation when schema is not provided', () => {
      route = createDownloadRoute(path, viewOnFail, undefined, requestHandler)
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeUndefined()
    })

    test('should include validation if validationSchema is provided and log the event', () => {
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeDefined()
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`validationSchema exists. ${path}`))
      expect(route.options.validate.query).toBe(validationSchema)
    })

    test('failAction should call renderErrorPage and return its value', async () => {
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      const fakeRequest = { query: { foo: 'bar' } }
      const h = {}
      const fakeError = new Error('fail')
      const result = await route.options.validate.failAction(fakeRequest, h, fakeError)
      expect(renderErrorPage).toHaveBeenCalledWith(viewOnFail, fakeRequest, h, fakeError)
      expect(result).toBe(`error:${viewOnFail}`)
    })
  })
})
