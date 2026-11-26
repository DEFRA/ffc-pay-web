describe('Router plugin feature flag', () => {
  let server
  const actual = jest.requireActual('../../../app/config')

  beforeEach(() => {
    jest.resetModules()
    server = {
      route: jest.fn(),
      state: jest.fn()
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

  test.each([
    [undefined, 'true', 'true', false, false],
    ['https://pds.example.gov.uk', 'false', undefined, false, false],
    ['https://pds.example.gov.uk', 'true', 'false', true, false],
    ['https://pds.example.gov.uk', 'false', 'True', false, true],
    ['http://localhost:3023', 'true', 'false', true, false, 'development']
  ])('switches card links independently (base=%s, alerts=%s, statements=%s)', async (pdsBaseUrl, alerts, statements, redirectAlerts, redirectStatements, env = 'test') => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: env, PDS_BASE_URL: pdsBaseUrl, REDIRECT_EMAIL_ALERTS: alerts, REDIRECT_STATEMENTS: statements })
    jest.dontMock('../../../app/config')

    try {
      const router = require('../../../app/plugins/router')
      const alertRoutes = require('../../../app/routes/alerts')
      const statementRoutes = [].concat(require('../../../app/routes/statements/download-statements'), require('../../../app/routes/statements/status-report'), require('../../../app/routes/statement-results'))
      const originalRoutes = [...alertRoutes, ...statementRoutes]
      const Hapi = require('@hapi/hapi')
      const testServer = Hapi.server()
      jest.replaceProperty(require('../../../app/config'), 'isDev', false)
      await testServer.register(require('../../../app/plugins/views'))

      router.plugin.register(server)

      const registeredRoutes = server.route.mock.calls[0][0]
      const expectedRedirects = [
        ...(redirectAlerts ? alertRoutes : []),
        ...(redirectStatements ? statementRoutes : [])
      ].filter(route => route.method === 'GET')

      expect(registeredRoutes).toContain(require('../../../app/routes/home'))

      for (const original of originalRoutes) {
        if (!expectedRedirects.includes(original)) {
          expect(registeredRoutes).toContain(original)
          if (original.method === 'GET' && original.path === '/alerts/manage') {
            testServer.route({ ...original, options: { ...original.options, auth: false } })
          }
          continue
        }

        const registered = registeredRoutes.find(route => route.method === 'GET' && route.path === original.path)
        expect(registered.options.auth).toEqual(original.options.auth)
        testServer.route({ ...registered, options: { ...registered.options, auth: false } })
      }

      for (const route of expectedRedirects) {
        const path = route.path.replace('{filename*}', 'reports/example.csv')
        const response = await testServer.inject(`${path}?updated=123`)
        const continueLink = response.payload.match(/<a\b[^>]*>\s*Continue to the new page\s*<\/a>/)?.[0]

        expect(response.statusCode).toBe(200)
        expect(response.headers.location).toBeUndefined()
        expect(response.payload).toMatch(/<h1\b[^>]*>\s*This service has now moved\s*<\/h1>/)
        expect(continueLink).toContain(` href="${pdsBaseUrl}${path}"`)
        expect(response.headers['cache-control']).toBe('no-store')
      }

      if (!redirectAlerts) {
        const response = await testServer.inject('/alerts/manage')
        expect(response.statusCode).toBe(200)
        expect(response.payload).toMatch(/<h1\b[^>]*>\s*Manage email alerts\s*<\/h1>/)
      }
    } finally {
      jest.restoreAllMocks()
    }
  })

  test.each([
    ['production', 'http://localhost:3023'],
    ['development', 'http://pds.example.gov.uk:3023']
  ])('rejects disallowed redirect origins (%s, %s)', (env, pdsBaseUrl) => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: env, PDS_BASE_URL: pdsBaseUrl })
    jest.dontMock('../../../app/config')

    try {
      expect(() => require('../../../app/config')).toThrow('pdsBaseUrl')
    } finally {
      jest.restoreAllMocks()
    }
  })
})
