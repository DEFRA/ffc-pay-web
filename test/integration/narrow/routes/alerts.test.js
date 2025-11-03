const { BAD_REQUEST } = require('../../../../app/constants/http-status-codes')

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
const userSchema = require('../../../../app/routes/schemas/user-schema')
const removeUserSchema = require('../../../../app/routes/schemas/remove-user-schema')

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
