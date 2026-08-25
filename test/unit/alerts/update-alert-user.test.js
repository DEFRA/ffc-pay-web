jest.mock('../../../app/api')
jest.mock('../../../app/alerts/get-alert-recipient-view-data')
jest.mock('../../../app/alerts/validation')

const { updateAlertUser } = require('../../../app/alerts/update-alert-user')
const { postAlerting, getAlertingData } = require('../../../app/api')
const { BAD_REQUEST } = require('../../../app/constants/http-status-codes')
const { getAlertRecipientViewData } = require('../../../app/alerts/get-alert-recipient-view-data')
const { isEmailTaken, isEmailBlocked } = require('../../../app/alerts/validation')

describe('updateAlertUser', () => {
  let h

  beforeEach(() => {
    jest.clearAllMocks()

    h = {
      redirect: jest.fn().mockReturnValue('redirected'),
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }

    getAlertingData.mockResolvedValue({ payload: { alertTypes: ['type1', 'type2', 'type3'] } })
    isEmailTaken.mockResolvedValue()
    isEmailBlocked.mockImplementation(() => { })
    postAlerting.mockResolvedValue()
    getAlertRecipientViewData.mockResolvedValue({ someViewData: true })
  })

  test('successfully updates alert user and redirects to the default manage-by-recipient path', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'type1',
      2: ['type2', 'type3']
    }
    const modifiedBy = 'adminUser'

    const result = await updateAlertUser(modifiedBy, { ...payload }, h)

    expect(isEmailTaken).toHaveBeenCalledWith(payload.emailAddress, payload.contactId)
    expect(isEmailBlocked).toHaveBeenCalledWith(payload.emailAddress)
    expect(postAlerting).toHaveBeenCalledWith(
      '/update-contact',
      expect.objectContaining({
        emailAddress: payload.emailAddress,
        modifiedBy,
        contactId: payload.contactId,
        type1: [1],
        type2: [2],
        type3: [2]
      }),
      null
    )
    expect(h.redirect).toHaveBeenCalledWith('/alerts/manage-by-recipient?updated=123')
    expect(result).toBe('redirected')
  })

  test('uses provided redirectPath when present', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'type1'
    }
    const modifiedBy = 'adminUser'

    const result = await updateAlertUser(modifiedBy, { ...payload }, h, '/custom-redirect')

    expect(h.redirect).toHaveBeenCalledWith('/custom-redirect')
    expect(result).toBe('redirected')
  })

  test('uses errorRedirectPath when provided and an error occurs', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'type1'
    }
    const modifiedBy = 'adminUser'
    const error = new Error('email blocked')

    isEmailBlocked.mockImplementation(() => { throw error })

    const errorRedirectPath = jest.fn().mockReturnValue('/error-path')
    h = {
      ...h,
      redirect: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnValue('redirected')
    }

    const result = await updateAlertUser(modifiedBy, { ...payload }, h, null, errorRedirectPath)

    expect(errorRedirectPath).toHaveBeenCalledWith(error)
    expect(h.redirect).toHaveBeenCalledWith('/error-path')
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe('redirected')
  })

  test('returns error view when no alert types selected', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123'
    }
    const modifiedBy = 'adminUser'

    const result = await updateAlertUser(modifiedBy, { ...payload }, h)

    expect(postAlerting).not.toHaveBeenCalled()
    expect(getAlertRecipientViewData).toHaveBeenCalledWith({
      query: { contactId: payload.contactId },
      auth: { credentials: { account: { name: modifiedBy } } }
    })
    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        error: 'At least one alert type must be selected.'
      })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe(h)
  })

  test('treats "all" alert type as all alert types fetched from API', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'all'
    }
    const modifiedBy = 'adminUser'

    await updateAlertUser(modifiedBy, { ...payload }, h)

    expect(postAlerting).toHaveBeenCalledWith(
      '/update-contact',
      expect.objectContaining({
        type1: [1],
        type2: [1],
        type3: [1]
      }),
      null
    )
  })

  test('handles isEmailTaken rejection with error view', async () => {
    const payload = {
      emailAddress: 'taken@example.com',
      contactId: '123',
      1: 'type1'
    }
    const modifiedBy = 'adminUser'
    const error = new Error('Email taken')

    isEmailTaken.mockRejectedValue(error)

    const result = await updateAlertUser(modifiedBy, { ...payload }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        error: error.message
      })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
    expect(postAlerting).not.toHaveBeenCalled()
    expect(result).toBe(h)
  })

  test('handles postAlerting rejection with error view', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'type1'
    }
    const modifiedBy = 'adminUser'
    const error = new Error('Post failed')

    postAlerting.mockRejectedValue(error)

    const result = await updateAlertUser(modifiedBy, { ...payload }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        error: error.message
      })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe(h)
  })

  test('ignores invalid payload entries and reserved keys', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      selectView: 'ignored',
      action: 'ignored',
      1: 42,
      2: { foo: 'bar' },
      3: 'type1'
    }
    const modifiedBy = 'adminUser'

    await updateAlertUser(modifiedBy, { ...payload }, h)

    expect(postAlerting).toHaveBeenCalledWith(
      '/update-contact',
      expect.objectContaining({
        type1: [3]
      }),
      null
    )
  })
})
