const { updateAlertUser } = require('../../../app/alerts/update-alert-user')
const { postAlerting, getAlertingData } = require('../../../app/api')
const { BAD_REQUEST } = require('../../../app/constants/http-status-codes')
const { getAlertUpdateViewData } = require('../../../app/alerts/get-alert-update-view-data')
const { isEmailTaken, isEmailBlocked } = require('../../../app/alerts/validation')

jest.mock('../../../app/api')
jest.mock('../../../app/alerts/get-alert-update-view-data')
jest.mock('../../../app/alerts/validation')

describe('updateAlertUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return view with error if email already registered to a different contactId', async () => {
    const modifiedBy = 'adminUser'
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123'
    }
    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }

    isEmailTaken.mockResolvedValue(true)
    isEmailBlocked.mockReturnValue(false)

    const mockViewData = { foo: 'bar' }
    getAlertUpdateViewData.mockResolvedValue(mockViewData)

    await updateAlertUser(modifiedBy, payload, h)

    expect(isEmailTaken).toHaveBeenCalledWith('test@example.com', '123')
    expect(isEmailBlocked).toHaveBeenCalledWith('test@example.com')
    expect(getAlertUpdateViewData).toHaveBeenCalledWith({
      query: { contactId: payload.contactId },
      auth: { credentials: { account: { name: modifiedBy } } }
    })
    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        ...mockViewData,
        error: expect.any(Error)
      })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
    expect(postAlerting).not.toHaveBeenCalled()
  })

  test('should return view with error if email is blocked', async () => {
    const modifiedBy = 'adminUser'
    const payload = {
      emailAddress: 'blocked@example.com',
      contactId: '123'
    }
    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }

    isEmailTaken.mockResolvedValue(false)
    isEmailBlocked.mockReturnValue(true)

    const mockViewData = { foo: 'bar' }
    getAlertUpdateViewData.mockResolvedValue(mockViewData)

    await updateAlertUser(modifiedBy, payload, h)

    expect(isEmailTaken).toHaveBeenCalledWith('blocked@example.com', '123')
    expect(isEmailBlocked).toHaveBeenCalledWith('blocked@example.com')
    expect(getAlertUpdateViewData).toHaveBeenCalledWith({
      query: { contactId: payload.contactId },
      auth: { credentials: { account: { name: modifiedBy } } }
    })
    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        ...mockViewData,
        error: expect.any(Error)
      })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
    expect(postAlerting).not.toHaveBeenCalled()
  })

  test('should proceed to post update and redirect if email is unique and not blocked', async () => {
    const modifiedBy = 'adminUser'
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'alertA',
      2: ['alertA', 'alertB'],
      3: 'alertC'
    }
    const h = { redirect: jest.fn() }

    isEmailTaken.mockResolvedValue(false)
    isEmailBlocked.mockReturnValue(false)

    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes: ['alertA', 'alertB', 'alertC']
      }
    })

    postAlerting.mockResolvedValue()

    const expectedData = {
      emailAddress: 'test@example.com',
      modifiedBy: 'adminUser',
      contactId: '123',
      alertA: [1, 2],
      alertB: [2],
      alertC: [3]
    }

    const result = await updateAlertUser(modifiedBy, payload, h)

    expect(isEmailTaken).toHaveBeenCalledWith('test@example.com', '123')
    expect(isEmailBlocked).toHaveBeenCalledWith('test@example.com')
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(postAlerting).toHaveBeenCalledWith('/update-contact', expectedData, null)
    expect(h.redirect).toHaveBeenCalledWith('/alerts')
    expect(result).toBe(h.redirect.mock.results[0].value)
  })

  test('should omit contactId in data if contactId is empty string', async () => {
    const modifiedBy = 'adminUser'
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '',
      4: 'alertX'
    }
    const h = { redirect: jest.fn() }

    isEmailTaken.mockResolvedValue(false)
    isEmailBlocked.mockReturnValue(false)

    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes: ['alertX']
      }
    })

    postAlerting.mockResolvedValue()

    const expectedData = {
      emailAddress: 'test@example.com',
      modifiedBy: 'adminUser',
      alertX: [4]
    }

    const result = await updateAlertUser(modifiedBy, payload, h)

    expect(postAlerting).toHaveBeenCalledWith('/update-contact', expectedData, null)
    expect(h.redirect).toHaveBeenCalledWith('/alerts')
    expect(result).toBe(h.redirect.mock.results[0].value)
  })

  test('should treat "all" alert type by expanding to all alert types from API', async () => {
    const modifiedBy = 'adminUser'
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'all'
    }
    const h = { redirect: jest.fn() }

    isEmailTaken.mockResolvedValue(false)
    isEmailBlocked.mockReturnValue(false)

    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes: ['alertA', 'alertB', 'alertC']
      }
    })

    postAlerting.mockResolvedValue()

    const expectedData = {
      emailAddress: 'test@example.com',
      modifiedBy: 'adminUser',
      contactId: '123',
      alertA: [1],
      alertB: [1],
      alertC: [1]
    }

    const result = await updateAlertUser(modifiedBy, payload, h)

    expect(postAlerting).toHaveBeenCalledWith('/update-contact', expectedData, null)
    expect(h.redirect).toHaveBeenCalledWith('/alerts')
    expect(result).toBe(h.redirect.mock.results[0].value)
  })

  test('should ignore payload keys with non-string and non-array values for alert types', async () => {
    const modifiedBy = 'adminUser'
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '1',
      5: 42,
      6: null,
      7: { foo: 'bar' }
    }
    const h = { redirect: jest.fn() }

    isEmailTaken.mockResolvedValue(false)
    isEmailBlocked.mockReturnValue(false)

    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes: []
      }
    })

    postAlerting.mockResolvedValue()

    const expectedData = {
      emailAddress: 'test@example.com',
      modifiedBy: 'adminUser',
      contactId: '1'
    }

    const result = await updateAlertUser(modifiedBy, payload, h)

    expect(postAlerting).toHaveBeenCalledWith('/update-contact', expectedData, null)
    expect(h.redirect).toHaveBeenCalledWith('/alerts')
    expect(result).toBe(h.redirect.mock.results[0].value)
  })

  test('should surface errors from isEmailTaken', async () => {
    const modifiedBy = 'adminUser'
    const payload = { emailAddress: 'fail@example.com', contactId: '1' }
    const h = { redirect: jest.fn() }

    const error = new Error('isEmailTaken failed')
    isEmailTaken.mockRejectedValue(error)
    isEmailBlocked.mockReturnValue(false)

    await expect(updateAlertUser(modifiedBy, payload, h)).rejects.toThrow('isEmailTaken failed')
    expect(postAlerting).not.toHaveBeenCalled()
    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('should surface errors from postAlerting', async () => {
    const modifiedBy = 'adminUser'
    const payload = { emailAddress: 'test@example.com', contactId: '1' }
    const h = { redirect: jest.fn() }

    isEmailTaken.mockResolvedValue(false)
    isEmailBlocked.mockReturnValue(false)

    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes: []
      }
    })

    const error = new Error('postAlerting failed')
    postAlerting.mockRejectedValue(error)

    await expect(updateAlertUser(modifiedBy, payload, h)).rejects.toThrow('postAlerting failed')
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
