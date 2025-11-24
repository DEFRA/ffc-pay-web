const { renderErrorPage } = require('../../../app/helpers/render-error-page')
const { getSchemes } = require('../../../app/helpers/get-schemes')

jest.mock('../../../app/helpers/get-schemes')
getSchemes.mockResolvedValue([{ name: 'Scheme 1' }, { name: 'Scheme 2' }])

describe('renderErrorPage', () => {
  let mockRequest, mockHapi, mockResponse, mockView, mockError

  beforeEach(() => {
    mockRequest = { log: jest.fn() }
    mockResponse = {
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }
    mockHapi = { view: jest.fn().mockReturnValue(mockResponse) }
    mockView = 'some-view'
    mockError = {
      details: [
        { message: 'Error message 1', path: ['field1'] },
        { message: 'Error message 2', path: ['field2'] }
      ]
    }
  })

  test('logs error details', async () => {
    await renderErrorPage(mockView, mockRequest, mockHapi, mockError)
    expect(mockRequest.log).toHaveBeenCalledWith(['error', 'validation'], mockError)
  })

  test('retrieves schemes', async () => {
    await renderErrorPage(mockView, mockRequest, mockHapi, mockError)
    expect(getSchemes).toHaveBeenCalled()
  })

  test('renders the view with errors and schemes', async () => {
    await renderErrorPage(mockView, mockRequest, mockHapi, mockError)
    expect(mockHapi.view).toHaveBeenCalledWith(mockView, {
      schemes: [{ name: 'Scheme 1' }, { name: 'Scheme 2' }],
      errors: [
        { text: 'Error message 1', href: '#field1' },
        { text: 'Error message 2', href: '#field2' }
      ]
    })
  })

  test('returns a 400 response code and calls takeover', async () => {
    const response = await renderErrorPage(mockView, mockRequest, mockHapi, mockError)
    expect(response.code).toHaveBeenCalledWith(400)
    expect(response.takeover).toHaveBeenCalled()
  })

  test('renders view with empty errors if error.details is undefined', async () => {
    const response = await renderErrorPage(mockView, mockRequest, mockHapi, {})
    expect(mockHapi.view).toHaveBeenCalledWith(mockView, {
      schemes: [{ name: 'Scheme 1' }, { name: 'Scheme 2' }],
      errors: []
    })
    expect(response.code).toHaveBeenCalledWith(400)
    expect(response.takeover).toHaveBeenCalled()
  })
})
