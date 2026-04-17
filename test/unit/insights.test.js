describe('Application Insights', () => {
  const DEFAULT_ENV = process.env
  let useAzureMonitor

  beforeEach(() => {
    jest.resetModules()

    jest.mock('@azure/monitor-opentelemetry', () => ({
      useAzureMonitor: jest.fn(),
    }))

    useAzureMonitor = require('@azure/monitor-opentelemetry').useAzureMonitor

    process.env = { ...DEFAULT_ENV }
  })

  afterAll(() => {
    process.env = DEFAULT_ENV
  })

  test('does not setup application insights if no connection string', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = undefined
    const appInsights = require('../../app/insights')

    appInsights.setup()

    expect(useAzureMonitor).not.toHaveBeenCalled()
  })

  test('does setup application insights if connection string present', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-connection-string'
    const appInsights = require('../../app/insights')

    appInsights.setup()

    expect(useAzureMonitor).toHaveBeenCalledTimes(1)
  })
})
