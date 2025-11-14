const { updateAlertUser } = require('../../../app/alerts/update-alert-user')
const { postAlerting, getAlertingData } = require('../../../app/api')
const { BAD_REQUEST } = require('../../../app/constants/http-status-codes')
const { getAlertUpdateViewData } = require('../../../app/alerts/get-alert-update-view-data')
const { isEmailTaken, isEmailBlocked } = require('../../../app/alerts/validation')

jest.mock('../../../app/api')
jest.mock('../../../app/alerts/get-alert-update-view-data')
jest.mock('../../../app/alerts/validation')

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
    getAlertingData.mockResolvedValue({
      payload: { alertTypes: ['type1', 'type2', 'type3'] }
    })
    isEmailTaken.mockResolvedValue()
    isEmailBlocked.mockImplementation(() => { })
    postAlerting.mockResolvedValue()
    getAlertUpdateViewData.mockResolvedValue({ someViewData: true })
  })

  test('should successfully update alert user and redirect', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'type1',
      2: ['type2', 'type3'],
      selectView: 'ignored',
      action: 'ignored'
    }
    const modifiedBy = 'adminUser'

    const result = await updateAlertUser(modifiedBy, payload, h)

    expect(isEmailTaken).toHaveBeenCalledWith(payload.emailAddress, payload.contactId)
    expect(isEmailBlocked).toHaveBeenCalledWith(payload.emailAddress)
    expect(postAlerting).toHaveBeenCalledWith(
      '/update-contact',
      expect.objectContaining({
        emailAddress: payload.emailAddress,
        modifiedBy,
        contactId: payload.contactId,
        type1: expect.any(Array),
        type2: expect.any(Array),
        type3: expect.any(Array)
      }),
      null
    )
    expect(h.redirect).toHaveBeenCalledWith('/alerts')
    expect(result).toBe('redirected')
  })

  test('should throw error if no alert types selected in payload', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      selectView: 'ignored',
      action: 'ignored'
    }
    const modifiedBy = 'adminUser'

    await expect(updateAlertUser(modifiedBy, payload, h)).resolves.toEqual(
      expect.objectContaining({})
    )
    expect(postAlerting).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should treat "all" alert type as all alert types fetched from API', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'all'
    }
    const modifiedBy = 'adminUser'

    await updateAlertUser(modifiedBy, payload, h)

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

  test('should call returnErrorView on isEmailTaken rejection', async () => {
    const payload = {
      emailAddress: 'taken@example.com',
      contactId: '123',
      1: 'type1'
    }
    const modifiedBy = 'adminUser'
    const error = new Error('Email taken')

    isEmailTaken.mockRejectedValue(error)

    await updateAlertUser(modifiedBy, payload, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({ error })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
    expect(postAlerting).not.toHaveBeenCalled()
  })

  test('should call returnErrorView on postAlerting rejection', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 'type1'
    }
    const modifiedBy = 'adminUser'
    const error = new Error('Post failed')

    postAlerting.mockRejectedValue(error)

    await updateAlertUser(modifiedBy, payload, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({ error })
    )
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should ignore invalid payload entries (non-string/non-array) and keys contactId/emailAddress', async () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: '123',
      1: 42,
      2: { foo: 'bar' },
      3: 'type1',
      selectView: 'ignored',
      action: 'ignored'
    }
    const modifiedBy = 'adminUser'

    await updateAlertUser(modifiedBy, payload, h)

    expect(postAlerting).toHaveBeenCalledWith(
      '/update-contact',
      expect.objectContaining({
        type1: [3]
      }),
      null
    )
  })
})
