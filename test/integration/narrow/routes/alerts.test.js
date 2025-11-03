jest.mock('../../../../app/alerts', () => ({
  getContactsByScheme: jest.fn(),
  getAlertUpdateViewData: jest.fn(),
  updateAlertUser: jest.fn(),
  removeAlertUser: jest.fn()
}))
jest.mock('../../../../app/api', () => ({
  getAlertingData: jest.fn()
}))
jest.mock('../../../../app/routes/schemas/user-schema', () => ({
  validate: jest.fn()
}))
jest.mock('../../../../app/routes/schemas/remove-user-schema', () => ({
  validate: jest.fn()
}))

const {
  getContactsByScheme,
  getAlertUpdateViewData,
  updateAlertUser,
  removeAlertUser
} = require('../../../../app/alerts')
const { getAlertingData } = require('../../../../app/api')
const { BAD_REQUEST } = require('../../../../app/constants/http-status-codes')

let createServer
let server

describe('Alerts test', () => {
  jest.mock('../../../../app/auth')

  createServer = require('../../../../app/server')
  const auth = {
    strategy: 'session-auth',
    credentials: {
      scope: [],
      account: {
        name: 'TestUser'
      }
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /alerts route returns 200 and renders schemes', async () => {
    const fakeSchemes = [{ id: 1, name: 'Email' }]
    getContactsByScheme.mockResolvedValue(fakeSchemes)

    const options = {
      method: 'GET',
      url: '/alerts',
      auth
    }

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(getContactsByScheme).toHaveBeenCalled()
    expect(response.payload).toContain('Email')
  })

  test('GET /alerts/information returns 200 and renders alert descriptions', async () => {
    const fakeAlertDescriptions = [{
      id: 'desc1',
      type: 'PAYMENT_ALERT',
      description: [
        'This alert triggers on payment issues.',
        'Please review payment details carefully.'
      ]
    }]
    getAlertingData.mockResolvedValue({
      payload: { alertDescriptions: fakeAlertDescriptions }
    })

    const options = {
      method: 'GET',
      url: '/alerts/information',
      auth
    }

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(getAlertingData).toHaveBeenCalledWith('/alert-descriptions')
    expect(response.payload).toContain('This alert triggers on payment issues.')
  })

  test('GET /alerts/update returns 200 with view data', async () => {
    const fakeViewData = { some: 'data' }
    getAlertUpdateViewData.mockResolvedValue(fakeViewData)

    const options = {
      method: 'GET',
      url: '/alerts/update',
      auth
    }

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(getAlertUpdateViewData).toHaveBeenCalled()
    expect(response.payload).toContain('data')
  })
})

describe('Alerts POST /alerts/update route tests', () => {
  const auth = {
    strategy: 'session-auth',
    credentials: {
      scope: [],
      account: {
        name: 'TestUser'
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('POST /alerts/update with action "remove" calls removeAlertUser and returns result', async () => {
    const payload = { action: 'remove', contactId: '123' }
    const h = {
      view: jest.fn(),
      code: jest.fn(() => h)
    }
    const request = {
      auth,
      payload
    }
    removeAlertUser.mockResolvedValue('remove-success')

    const handler = require('../../../../app/routes/alerts').find(
      route => route.method === 'POST' && route.path === '/alerts/update'
    ).handler

    const result = await handler(request, h)

    expect(removeAlertUser).toHaveBeenCalledWith('TestUser', '123', h)
    expect(result).toBe('remove-success')
  })

  test('POST /alerts/update with non-remove action calls updateAlertUser and returns result', async () => {
    const payload = { action: 'update', foo: 'bar' }
    const h = {
      view: jest.fn(),
      code: jest.fn(() => h)
    }
    const request = {
      auth,
      payload
    }
    updateAlertUser.mockResolvedValue('update-success')

    const handler = require('../../../../app/routes/alerts').find(
      route => route.method === 'POST' && route.path === '/alerts/update'
    ).handler

    const result = await handler(request, h)

    expect(updateAlertUser).toHaveBeenCalledWith('TestUser', payload, h)
    expect(result).toBe('update-success')
  })

  test('POST /alerts/update handler catches errors and renders error view with BAD_REQUEST', async () => {
    const payload = { action: 'update', foo: 'bar' }
    const request = {
      auth,
      payload
    }
    const error = new Error('Something went wrong')
    updateAlertUser.mockRejectedValue(error)
    getAlertUpdateViewData.mockResolvedValue({ some: 'viewdata' })

    const h = {
      view: jest.fn(() => h),
      code: jest.fn(() => h)
    }

    const handler = require('../../../../app/routes/alerts').find(
      route => route.method === 'POST' && route.path === '/alerts/update'
    ).handler

    const result = await handler(request, h)

    expect(updateAlertUser).toHaveBeenCalled()
    expect(getAlertUpdateViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/update', { some: 'viewdata', error })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(h)
  })
})
