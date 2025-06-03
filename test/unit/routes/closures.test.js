const Hapi = require('@hapi/hapi')
const routes = require('../../../app/routes/closures')
const { handleBulkClosureError } = require('../../../app/closure/handle-bulk-closure-error')
const { handleBulkClosure } = require('../../../app/closure/handle-bulk-closure')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../../../app/constants/payload-sizes')
const CLOSURES_ROUTES = require('../../../app/constants/closures-routes')

jest.mock('../../../app/closure/handle-bulk-closure')
jest.mock('../../../app/closure/handle-bulk-closure-error')

describe('POST /closure/bulk route', () => {
  let server

  beforeEach(async () => {
    server = Hapi.server()

    const testRoutes = routes.map(route => ({
      ...route,
      options: {
        ...route.options,
        auth: false
      }
    }))

    server.route(testRoutes)
    jest.clearAllMocks()
  })

  test('calls handleBulkClosure on valid payload', async () => {
    const route = server.match('POST', CLOSURES_ROUTES.BULK)

    const request = {
      payload: {
        crumb: 'valid-crumb',
        file: {
          path: '/tmp/valid.csv',
          bytes: 123,
          filename: 'valid.csv',
          headers: {
            'content-disposition': 'form-data; name="file"; filename="valid.csv"',
            'content-type': 'text/csv'
          }
        }
      },
      auth: { credentials: { scope: ['closure:admin'] } }
    }

    const h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }

    handleBulkClosure.mockResolvedValue({ statusCode: 200 })

    const handler = route.settings.handler
    await handler(request, h)

    expect(handleBulkClosure).toHaveBeenCalled()
  })

  test('calls handleBulkClosureError when schema validation fails (validate.failAction)', async () => {
    const invalidPayload = {}
    const mockError = new Error('Invalid payload')

    const route = server.match('POST', CLOSURES_ROUTES.BULK)
    const { failAction } = route.settings.validate

    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }

    await failAction(
      { payload: invalidPayload, state: {} },
      h,
      mockError
    )

    expect(handleBulkClosureError).toHaveBeenCalledWith(expect.any(Object), mockError, undefined)
  })

  test('calls handleBulkClosureError when file too large (payload.failAction)', async () => {
    const payload = {
      crumb: 'test-crumb',
      file: {
        path: '/tmp/too-large.csv',
        bytes: MAX_BYTES + 1,
        filename: 'too-large.csv',
        headers: {
          'content-disposition': 'form-data; name="file"; filename="too-large.csv"',
          'content-type': 'text/csv'
        }
      }
    }

    const route = server.match('POST', CLOSURES_ROUTES.BULK)
    const { failAction } = route.settings.payload

    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }

    await failAction(
      { payload, state: {} },
      h,
      new Error('Payload too large')
    )

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      expect.any(Object),
      `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`,
      'test-crumb'
    )
  })

  test('uses crumb from request.state if not present in payload', async () => {
    const route = server.match('POST', CLOSURES_ROUTES.BULK)
    const { failAction } = route.settings.validate

    const mockError = new Error('Mock validation error')
    const fakeRequest = {
      payload: {},
      state: {
        crumb: 'state-crumb'
      }
    }

    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }

    await failAction(fakeRequest, h, mockError)

    expect(handleBulkClosureError).toHaveBeenCalledWith(expect.any(Object), mockError, 'state-crumb')
  })
})
