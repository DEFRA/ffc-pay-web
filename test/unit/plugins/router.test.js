describe('Router plugin feature flag', () => {
  let server
  const actual = jest.requireActual('../../../app/config')

  beforeEach(() => {
    jest.resetModules()
    server = {
      route: jest.fn()
    }
  })

  test('adds legacy routes when legacyReportsEnabled = true', () => {
    jest.doMock('../../../app/config', () => {
      return {
        ...actual,
        legacyReportsEnabled: true
      }
    })

    const router = require('../../../app/plugins/router')

    router.plugin.register(server)

    const routes = server.route.mock.calls[0][0]

    const paths = routes.map(r => r.path)

    expect(paths).toContain('/report-list/claim-level-report')
    expect(paths).toContain('/report-list/transaction-summary')
  })

  test('does not add legacy routes when legacyReportsEnabled = false', () => {
    jest.doMock('../../../app/config', () => {
      return {
        ...actual,
        legacyReportsEnabled: false
      }
    })

    const router = require('../../../app/plugins/router')

    router.plugin.register(server)

    const routes = server.route.mock.calls[0][0]

    const paths = routes.map(r => r.path)

    expect(paths).not.toContain('/report-list/claim-level-report')
    expect(paths).not.toContain('/report-list/transaction-summary')
  })
})
