jest.mock('../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

const { getAlertingData } = require('../../../app/api')
const { getAlertRemoveViewData } = require('../../../app/alerts/get-alert-remove-view-data')

describe('getAlertRemoveViewData', () => {
  let consoleLogSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('returns undefined contactId and emailAddress when no query params provided', async () => {
    const result = await getAlertRemoveViewData({})

    expect(getAlertingData).not.toHaveBeenCalled()
    expect(result).toEqual({ contactId: undefined, emailAddress: undefined })
  })

  test('calls getAlertingData with encoded contactId and returns contact payload', async () => {
    getAlertingData.mockResolvedValue({
      payload: {
        contact: {
          contactId: '123',
          emailAddress: 'user@example.com'
        }
      }
    })

    const request = {
      query: { contactId: '123' },
      auth: { credentials: { account: { name: 'Alice' } } }
    }

    const result = await getAlertRemoveViewData(request)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/123')
    expect(result).toEqual({
      contactId: '123',
      emailAddress: 'user@example.com'
    })
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'User Alice has accessed the remove alert recipient page for user@example.com'
    )
  })

  test('calls getAlertingData with encoded emailAddress when contactId is missing', async () => {
    getAlertingData.mockResolvedValue({
      payload: {
        contact: {
          contactId: '456',
          emailAddress: 'user+test@example.com'
        }
      }
    })

    const request = {
      query: { emailAddress: 'user+test@example.com' },
      auth: { credentials: { account: { username: 'bob' } } }
    }

    const result = await getAlertRemoveViewData(request)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/user%2Btest%40example.com')
    expect(result).toEqual({
      contactId: '456',
      emailAddress: 'user+test@example.com'
    })
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'User bob has accessed the remove alert recipient page for user+test@example.com'
    )
  })

  test('falls back to account email when name and username are missing', async () => {
    getAlertingData.mockResolvedValue({
      payload: {
        contact: {
          contactId: '789',
          emailAddress: 'test@example.com'
        }
      }
    })

    const request = {
      query: { contactId: '789' },
      auth: { credentials: { account: { email: 'email@example.com' } } }
    }

    await getAlertRemoveViewData(request)

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'User email@example.com has accessed the remove alert recipient page for test@example.com'
    )
  })

  test('returns contactId when contact payload is missing but query contactId exists', async () => {
    getAlertingData.mockResolvedValue({ payload: {} })

    const request = {
      query: { contactId: '789' }
    }

    const result = await getAlertRemoveViewData(request)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/789')
    expect(result).toEqual({
      contactId: '789',
      emailAddress: undefined
    })
  })
})
