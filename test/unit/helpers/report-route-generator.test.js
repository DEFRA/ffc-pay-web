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
    const returnViewRoute = 'myView'
    let route
    beforeEach(() => {
      route = createFormRoute(path, returnViewRoute)
    })
    test('returns valid form route', async () => {
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      const hObj = { dummy: 'object' }
      const result = await route.options.handler({}, hObj)
      expect(getView).toHaveBeenCalledWith(returnViewRoute, hObj)
      expect(result).toBe(`view:${returnViewRoute}`)
    })
    test('propagates error if getView rejects', async () => {
      getView.mockRejectedValueOnce(new Error('fail'))
      await expect(route.options.handler({}, {})).rejects.toThrow('fail')
    })
  })

  describe('createDownloadRoute', () => {
    const path = '/download'
    const viewOnFail = 'failView'
    const validationSchema = { foo: 'bar' }
    const requestHandler = jest.fn(async () => 'downloaded')
    let route
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {})
    })
    afterEach(() => {
      jest.restoreAllMocks()
    })
    test('returns route without validation when schema is undefined', () => {
      route = createDownloadRoute(path, viewOnFail, undefined, requestHandler)
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeUndefined()
      expect(console.log).not.toHaveBeenCalled()
    })
    test('returns route with validation when schema is provided', () => {
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      expect(route.method).toBe('GET')
      expect(route.path).toBe(path)
      expect(route.options.auth).toEqual(AUTH_SCOPE)
      expect(route.options.handler).toBe(requestHandler)
      expect(route.options.validate).toBeDefined()
      expect(route.options.validate.query).toEqual(validationSchema)
      expect(console.log).toHaveBeenCalledWith('validationSchema exists. ' + path)
    })
    test('failAction calls renderErrorPage and returns its value', async () => {
      route = createDownloadRoute(path, viewOnFail, validationSchema, requestHandler)
      const fakeRequest = { query: {} }
      const h = {}
      const fakeError = new Error('fail')
      const result = await route.options.validate.failAction(fakeRequest, h, fakeError)
      expect(renderErrorPage).toHaveBeenCalledWith(viewOnFail, fakeRequest, h, fakeError)
      expect(result).toBe(`error:${viewOnFail}`)
    })
    test('works with empty object schema', () => {
      route = createDownloadRoute(path, viewOnFail, {}, requestHandler)
      expect(route.options.validate.query).toEqual({})
      expect(console.log).toHaveBeenCalledWith('validationSchema exists. ' + path)
    })
  })
})
