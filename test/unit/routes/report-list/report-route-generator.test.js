const { createFormRoute, createDownloadRoute } = require('../../../../app/helpers/report-route-generator')
const { holdAdmin, schemeAdmin, dataView } = require('../../../../app/auth/permissions')

jest.mock('../../../../app/helpers/get-view', () => ({
  getView: jest.fn((returnViewRoute, h) => Promise.resolve(`view:${returnViewRoute}`))
}))
jest.mock('../../../../app/helpers/render-error-page', () => ({
  renderErrorPage: jest.fn((viewOnFail, request, h, err) => Promise.resolve(`error:${viewOnFail}`))
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
      getView.mockClear()
    })

    test('should return a route object with method GET and provided path', () => {
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
    })

    test('should set auth scope correctly', () => {
      expect(route.options.auth).toEqual(AUTH_SCOPE)
    })

    test('handler should call getView with given returnViewRoute and h and resolve with its value', async () => {
      const hObj = { some: 'object' }
      const result = await route.options.handler({}, hObj)
      expect(getView).toHaveBeenCalledWith(returnViewRoute, hObj)
      expect(result).toBe(`view:${returnViewRoute}`)
    })

    test('handler should propagate error from getView', async () => {
      getView.mockRejectedValueOnce(new Error('fail'))
      await expect(route.options.handler({}, {})).rejects.toThrow('fail')
    })
  })

  describe('createDownloadRoute', () => {
    const path = '/download'
    const viewOnFail = 'errorView'
    const validationSchema = { foo: 'bar' }
    const requestHandler = jest.fn(async () => 'handled')
    let route
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {})
      requestHandler.mockClear()
    })
    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should return a route object without validation when schema is undefined', () => {
      route = createDownloadRoute(path, viewOnFail, undefined, requestHandler)
      expect(route).toBeDefined()
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeUndefined()
      expect(console.log).not.toHaveBeenCalled()
    })

    test('should return a route object with validation when schema is provided', () => {
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

    test('failAction should call renderErrorPage and return its resolved value', async () => {
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      const fakeRequest = { query: { foo: 'bar' } }
      const hObj = {}
      const fakeError = new Error('fail')
      const result = await route.options.validate.failAction(fakeRequest, hObj, fakeError)
      expect(renderErrorPage).toHaveBeenCalledWith(viewOnFail, fakeRequest, hObj, fakeError)
      expect(result).toBe(`error:${viewOnFail}`)
    })

    test('works with an empty object schema', () => {
      route = createDownloadRoute(path, viewOnFail, {}, requestHandler)
      expect(route.options.validate.query).toEqual({})
      expect(console.log).toHaveBeenCalledWith('validationSchema exists. ' + path)
    })
  })
})
