jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')

const { Readable } = require('stream')
const cheerio = require('cheerio')
const { applicationAdmin } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')
const { FRN } = require('../../../mocks/values/frn')
const { AGREEMENT_NUMBER } = require('../../../mocks/values/agreement-number')
const { getRetentionData, postRetention } = require('../../../../app/api')
const getCrumbs = require('../../../helpers/get-crumbs')
const { getSchemesForClosures } = require('../../../../app/helpers')
const { getClosures } = require('../../../../app/closure')
const CLOSURES_ROUTES = require('../../../../app/constants/closures-routes')
const CLOSURES_VIEWS = require('../../../../app/constants/closures-views')
const { AGREEMENT_CLOSURES_LINKS } = require('../../../../app/constants/section-links')

jest.mock('../../../../app/storage', () => ({
  getRetentionExtractDownloadStreamAndDeleteAfter: jest.fn()
}))

const { getRetentionExtractDownloadStreamAndDeleteAfter } = require('../../../../app/storage')

jest.mock('../../../../app/helpers', () => ({
  ...jest.requireActual('../../../../app/helpers'),
  getSchemesForClosures: jest.fn()
}))

jest.mock('../../../../app/closure', () => ({
  ...jest.requireActual('../../../../app/closure'),
  getClosures: jest.fn()
}))

beforeEach(() => {
  getSchemesForClosures.mockResolvedValue([
    { schemeId: 'SFI', name: 'SFI Scheme' },
    { schemeId: 'OTHER', name: 'Other Scheme' }
  ])
})

let server
let auth

const mockGetClosures = () => {
  getRetentionData.mockResolvedValue({
    payload: {
      closures: [{
        frn: FRN,
        agreementNumber: AGREEMENT_NUMBER,
        schemeName: 'SFI22',
        endDate: '2023-09-12'
      }]
    }
  })
}

const loadPage = async (method, url, authOverride) => {
  const res = await server.inject({ method, url, auth: authOverride })
  return { res, $: cheerio.load(res.payload) }
}

describe('Closures', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [applicationAdmin] } }
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  const getRoutes = [
    { url: '/closure/add', h1: 'Create a new agreement closure' },
    { url: '/closure/bulk', h1: 'Bulk add agreement closures' }
  ]

  describe('GET pages', () => {
    test.each(getRoutes)('%s loads page successfully', async ({ url, h1 }) => {
      const { res, $ } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe(h1)
    })

    test.each(getRoutes)('%s returns 403 with no permission', async ({ url }) => {
      auth.credentials.scope = []

      const { res } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(403)
    })

    test.each(getRoutes)('%s redirects without auth', async ({ url }) => {
      const { res } = await loadPage('GET', url)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })

    test('GET /closure/manage returns view with cards minus first and closureAdded query', async () => {
      const url = `${CLOSURES_ROUTES.MANAGE}?closureAdded=addedValue`

      const { res, $ } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe('Manage agreement closures')
    })

    test('GET /closure/search with search params returns correct view and flags', async () => {
      const mockClosures = [{ id: 1 }]
      const mockCount = 10
      const mockSchemes = [{ schemeId: 'test', name: 'Test Scheme' }]

      getClosures.mockResolvedValue({ closures: mockClosures, count: mockCount })
      getSchemesForClosures.mockResolvedValue(mockSchemes)

      const url = `${CLOSURES_ROUTES.SEARCH}?page=1&pageSize=5&frnAgreement=someFrn&schemeId=someScheme&closureRemoved=true`

      const { res, $ } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe('Search agreement closures')
    })

    test('GET /closure/search without search params returns correct pagination flags', async () => {
      const mockClosures = [{ id: 1 }]
      const mockCount = 45
      const mockSchemes = []

      getClosures.mockResolvedValue({ closures: mockClosures, count: mockCount })
      getSchemesForClosures.mockResolvedValue(mockSchemes)

      const url = `${CLOSURES_ROUTES.SEARCH}?page=3&pageSize=10`

      const { res, $ } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe('Search agreement closures')
    })
  })

  describe('POST /closure/add', () => {
    const method = 'POST'
    const url = '/closure/add'
    const h1 = 'Create a new agreement closure'

    const postReq = async (payload, cookieCrumb) => server.inject({
      method,
      url,
      auth,
      payload,
      headers: { cookie: `crumb=${cookieCrumb}` }
    })

    test('successful submission for sfi22 posts retention and redirects', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 1,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const res = await postReq(payload, cookieCrumb)

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        {
          schemeId: 1,
          frn: FRN,
          agreementNumber: AGREEMENT_NUMBER,
          endDate: '2023-08-12T00:00:00',
          addedBy: undefined
        },
        null
      )

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/closure/manage?closureAdded=single')
    })

    test('successful submission for not sfi22 posts retention and redirects', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 2,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const res = await postReq(payload, cookieCrumb)

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        {
          schemeId: 2,
          frn: FRN,
          agreementNumber: AGREEMENT_NUMBER,
          endDate: '2023-08-12T00:00:00',
          addedBy: undefined
        },
        null
      )

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/closure/manage?closureAdded=single')
    })

    const errorCases = [
      { frn: 10000000001, msg: 'Enter a 10-digit FRN' },
      { frn: 999999998, msg: 'Enter a 10-digit FRN' },
      { frn: 'not-a-number', msg: 'Enter a 10-digit FRN' },
      { frn: undefined, msg: 'Enter a 10-digit FRN' },

      { frn: 1000000000, agreement: undefined, msg: 'Enter a valid agreement number' },
      { frn: 1000000000, agreement: 'x'.repeat(60), msg: 'Enter a valid agreement number' },

      { day: 35, msg: 'Enter a valid day' },
      { day: -4, msg: 'Enter a valid day' },
      { day: 3.5, msg: 'Enter a valid day' },
      { day: 'x', msg: 'Enter a valid day' },
      { day: undefined, msg: 'Enter a valid day' },

      { month: 14, msg: 'Enter a valid month' },
      { month: -8, msg: 'Enter a valid month' },
      { month: 8.1, msg: 'Enter a valid month' },
      { month: 'x', msg: 'Enter a valid month' },
      { month: undefined, msg: 'Enter a valid month' },

      { year: 5323, msg: 'Enter a valid year' },
      { year: -2023, msg: 'Enter a valid year' },
      { year: 20.23, msg: 'Enter a valid year' },
      { year: 'x', msg: 'Enter a valid year' },
      { year: undefined, msg: 'Enter a valid year' }
    ]

    const base = {
      frn: 1000000000,
      agreement: AGREEMENT_NUMBER,
      day: 12,
      month: 8,
      year: 2023
    }

    test.each(errorCases)(
      'returns 400 and error for invalid payload: %p',
      async err => {
        const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

        const res = await postReq({ ...base, ...err, crumb: viewCrumb }, cookieCrumb)
        const $ = cheerio.load(res.payload)

        expect(res.statusCode).toBe(400)
        expect($('h1').text()).toBe(h1)
        expect($('.govuk-error-summary__title').text()).toMatch('There is a problem')
        expect($('.govuk-error-message').text()).toMatch(`Error: ${err.msg}`)
      }
    )

    test.each([
      { crumb: 'invalid' },
      { crumb: undefined }
    ])('403 when crumb invalid: %p', async ({ crumb }) => {
      const { cookieCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

      const res = await postReq({
        crumb,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }, cookieCrumb)

      expect(res.statusCode).toBe(403)
    })

    test('GET /closure/add passes through query params correctly', async () => {
      const url = '/closure/add?frn=123&agreement=abc&schemeId=1&day=2&month=3&year=2024'

      const { res, $ } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe('Create a new agreement closure')
    })

    test('POST /closure/add with padded day and month', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, '/closure/add', auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 1,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 3,
        month: 7,
        year: 2023
      }

      const res = await server.inject({
        method: 'POST',
        url: '/closure/add',
        auth,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        expect.objectContaining({ endDate: '2023-07-03T00:00:00' }),
        null
      )

      expect(res.statusCode).toBe(302)
    })

    test('POST /closure/add with addedBy from user name', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, '/closure/add', auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 1,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const authWithName = {
        strategy: 'session-auth',
        credentials: {
          scope: [applicationAdmin],
          account: {
            name: 'Test User'
          }
        }
      }

      const res = await server.inject({
        method: 'POST',
        url: '/closure/add',
        auth: authWithName,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        expect.objectContaining({ addedBy: 'Test User' }),
        null
      )

      expect(res.statusCode).toBe(302)
    })

    test('POST /closure/add with addedBy from username fallback', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, '/closure/add', auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 1,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const authWithUsername = {
        strategy: 'session-auth',
        credentials: {
          scope: [applicationAdmin],
          account: {
            username: 'user123'
          }
        }
      }

      const res = await server.inject({
        method: 'POST',
        url: '/closure/add',
        auth: authWithUsername,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        expect.objectContaining({ addedBy: 'user123' }),
        null
      )

      expect(res.statusCode).toBe(302)
    })

    test('POST /closure/add with addedBy from email fallback', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, '/closure/add', auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 1,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const authWithEmail = {
        strategy: 'session-auth',
        credentials: {
          scope: [applicationAdmin],
          account: {
            email: 'email@example.com'
          }
        }
      }

      const res = await server.inject({
        method: 'POST',
        url: '/closure/add',
        auth: authWithEmail,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        expect.objectContaining({ addedBy: 'email@example.com' }),
        null
      )

      expect(res.statusCode).toBe(302)
    })

    test('POST /closure/add with addedBy undefined if no account info', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, '/closure/add', auth)

      const payload = {
        crumb: viewCrumb,
        schemeId: 1,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const authNoAccount = {
        strategy: 'session-auth',
        credentials: {
          scope: [applicationAdmin],
          account: undefined
        }
      }

      const res = await server.inject({
        method: 'POST',
        url: '/closure/add',
        auth: authNoAccount,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(postRetention).toHaveBeenCalledWith(
        '/closure/add',
        expect.objectContaining({ addedBy: undefined }),
        null
      )

      expect(res.statusCode).toBe(302)
    })
  })

  describe('POST /closure/add/confirm', () => {
    let routes
    let addConfirmRoute
    let h
    let request

    beforeEach(() => {
      routes = require('../../../../app/routes/closures')
      addConfirmRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.ADD_CONFIRM && route.method === 'POST'
      )

      h = {
        view: jest.fn(() => h),
        code: jest.fn(() => h),
        takeover: jest.fn(() => h)
      }

      request = {
        payload: {
          schemeId: 'SFI',
          frn: FRN,
          agreement: AGREEMENT_NUMBER,
          day: 12,
          month: 8,
          year: 2023
        },
        auth,
        state: {}
      }
    })

    test('handler returns confirmation view with selected scheme name', async () => {
      const schemes = [
        { schemeId: 'SFI', name: 'SFI Scheme' },
        { schemeId: 'OTHER', name: 'Other Scheme' }
      ]

      getSchemesForClosures.mockResolvedValue(schemes)

      const result = await addConfirmRoute.options.handler(request, h)

      expect(getSchemesForClosures).toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.ADD_CONFIRM, {
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        schemeId: 'SFI',
        schemeName: 'SFI Scheme',
        day: 12,
        month: 8,
        year: 2023
      })

      expect(result).toBe(h)
    })

    test('handler returns confirmation view without scheme name when selected scheme is not found', async () => {
      getSchemesForClosures.mockResolvedValue([
        { schemeId: 'OTHER', name: 'Other Scheme' }
      ])

      const result = await addConfirmRoute.options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.ADD_CONFIRM, {
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        schemeId: 'SFI',
        schemeName: undefined,
        day: 12,
        month: 8,
        year: 2023
      })

      expect(result).toBe(h)
    })

    test('failAction returns add view with errors, schemes and submitted values', async () => {
      const error = new Error('Validation failed')
      const schemes = [
        { schemeId: 'SFI', name: 'SFI Scheme' }
      ]

      getSchemesForClosures.mockResolvedValue(schemes)

      const result = await addConfirmRoute.options.validate.failAction(request, h, error)

      expect(getSchemesForClosures).toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.ADD, {
        errors: error,
        schemes,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        schemeId: 'SFI',
        day: 12,
        month: 8,
        year: 2023
      })

      expect(h.code).toHaveBeenCalledWith(400)
      expect(h.takeover).toHaveBeenCalled()
      expect(result).toBe(h)
    })
  })

  describe('GET /closure/add handler details', () => {
    test('passes schemes and query values to the add view', async () => {
      const routes = require('../../../../app/routes/closures')
      const addRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.ADD && route.method === 'GET'
      )

      const schemes = [
        { schemeId: 'SFI', name: 'SFI Scheme' }
      ]

      getSchemesForClosures.mockResolvedValue(schemes)

      const h = {
        view: jest.fn(() => h)
      }

      const request = {
        query: {
          frn: FRN,
          agreement: AGREEMENT_NUMBER,
          schemeId: 'SFI',
          day: '12',
          month: '8',
          year: '2023'
        }
      }

      const result = await addRoute.options.handler(request, h)

      expect(getSchemesForClosures).toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.ADD, {
        schemes,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        schemeId: 'SFI',
        day: '12',
        month: '8',
        year: '2023'
      })

      expect(result).toBe(h)
    })
  })

  describe('POST /closure/add validation handling', () => {
    test('failAction returns add view with submitted values and bad request status', async () => {
      const routes = require('../../../../app/routes/closures')
      const addRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.ADD && route.method === 'POST'
      )

      const error = new Error('Validation failed')

      const h = {
        view: jest.fn(() => h),
        code: jest.fn(() => h),
        takeover: jest.fn(() => h)
      }

      const request = {
        payload: {
          frn: FRN,
          agreement: AGREEMENT_NUMBER,
          schemeId: 'SFI',
          day: 12,
          month: 8,
          year: 2023
        }
      }

      const result = await addRoute.options.validate.failAction(request, h, error)

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.ADD, {
        errors: error,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        schemeId: 'SFI',
        day: 12,
        month: 8,
        year: 2023
      })

      expect(h.code).toHaveBeenCalledWith(400)
      expect(h.takeover).toHaveBeenCalled()
      expect(result).toBe(h)
    })
  })

  describe('GET /closure/manage and /closure/search handlers', () => {
    let h
    let request

    beforeEach(() => {
      h = {
        view: jest.fn(() => h),
        code: jest.fn(() => h),
        takeover: jest.fn(() => h),
        redirect: jest.fn(() => h),
        response: jest.fn(() => h)
      }

      auth = {
        strategy: 'session-auth',
        credentials: {
          scope: [applicationAdmin]
        }
      }

      request = {
        query: {},
        payload: {},
        auth,
        state: {}
      }

      jest.clearAllMocks()
    })

    test('GET /closure/manage handler returns cards minus first and closureAdded', async () => {
      const routes = require('../../../../app/routes/closures')
      const manageRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.MANAGE && route.method === 'GET'
      )

      request.query.closureAdded = 'addedValue'

      const result = await manageRoute.options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.MANAGE, {
        cards: AGREEMENT_CLOSURES_LINKS.slice(1),
        closureAdded: 'addedValue'
      })

      expect(result).toBe(h)
    })

    test('GET /closure/search handler returns correct view with search params', async () => {
      const routes = require('../../../../app/routes/closures')
      const searchRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.SEARCH && route.method === 'GET'
      )

      const mockClosures = [{ id: 1 }]
      const mockCount = 10
      const mockSchemes = [{ schemeId: 'test', name: 'Test Scheme' }]

      getClosures.mockResolvedValue({ closures: mockClosures, count: mockCount })
      getSchemesForClosures.mockResolvedValue(mockSchemes)

      request.query = {
        page: '1',
        pageSize: '5',
        frnAgreement: 'someFrn',
        schemeId: 'someScheme',
        closureRemoved: 'true'
      }

      const result = await searchRoute.options.handler(request, h)

      expect(getClosures).toHaveBeenCalledWith({
        page: 1,
        pageSize: 5,
        frnAgreement: 'someFrn',
        schemeId: 'someScheme'
      })

      expect(getSchemesForClosures).toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.SEARCH, {
        closures: mockClosures,
        schemes: mockSchemes,
        page: 1,
        pageSize: 5,
        frnAgreement: 'someFrn',
        schemeId: 'someScheme',
        count: mockCount,
        hasPreviousPage: false,
        hasNextPage: true,
        closureRemoved: 'true'
      })

      expect(result).toBe(h)
    })

    test('GET /closure/search handler returns pagination flags correctly when no search params', async () => {
      const routes = require('../../../../app/routes/closures')
      const searchRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.SEARCH && route.method === 'GET'
      )

      const mockClosures = [{ id: 1 }]
      const mockCount = 45
      const mockSchemes = []

      getClosures.mockResolvedValue({ closures: mockClosures, count: mockCount })
      getSchemesForClosures.mockResolvedValue(mockSchemes)

      request.query = {
        page: '3',
        pageSize: '10'
      }

      const result = await searchRoute.options.handler(request, h)

      expect(getClosures).toHaveBeenCalledWith({
        page: 3,
        pageSize: 10,
        frnAgreement: null,
        schemeId: null
      })

      expect(getSchemesForClosures).toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(
        CLOSURES_VIEWS.SEARCH,
        expect.objectContaining({
          closures: mockClosures,
          schemes: mockSchemes,
          page: 3,
          pageSize: 10,
          frnAgreement: null,
          schemeId: null,
          count: mockCount,
          hasPreviousPage: true,
          hasNextPage: true,
          closureRemoved: undefined
        })
      )

      expect(result).toBe(h)
    })

    test('GET /closure/search handler uses default page and page size when query values are not supplied', async () => {
      const routes = require('../../../../app/routes/closures')
      const searchRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.SEARCH && route.method === 'GET'
      )

      const mockClosures = []
      const mockCount = 0
      const mockSchemes = [
        { schemeId: 'SFI', name: 'SFI Scheme' }
      ]

      getClosures.mockResolvedValue({ closures: mockClosures, count: mockCount })
      getSchemesForClosures.mockResolvedValue(mockSchemes)

      request.query = {}

      const result = await searchRoute.options.handler(request, h)

      expect(getClosures).toHaveBeenCalledWith({
        page: 1,
        pageSize: 2500,
        frnAgreement: null,
        schemeId: null
      })

      expect(getSchemesForClosures).toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.SEARCH, {
        closures: mockClosures,
        schemes: mockSchemes,
        page: 1,
        pageSize: 2500,
        frnAgreement: null,
        schemeId: null,
        count: mockCount,
        hasPreviousPage: false,
        hasNextPage: false,
        closureRemoved: undefined
      })

      expect(result).toBe(h)
    })
  })

  describe('GET /closure/remove/confirm', () => {
    test('loads remove confirmation page with query values', async () => {
      const url = `${CLOSURES_ROUTES.REMOVE_CONFIRM}?retentionDataId=123&frn=${FRN}&agreementNumber=${AGREEMENT_NUMBER}&schemeName=SFI22`

      const { res, $ } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(200)
      expect($('h1').text().trim()).toBe('Are you sure you want to remove this agreement closure?')
    })

    test('handler returns remove confirmation view with query values', async () => {
      const routes = require('../../../../app/routes/closures')
      const removeConfirmRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.REMOVE_CONFIRM && route.method === 'GET'
      )

      const h = {
        view: jest.fn(() => h)
      }

      const request = {
        query: {
          retentionDataId: '123',
          frn: FRN,
          agreementNumber: AGREEMENT_NUMBER,
          schemeName: 'SFI22'
        }
      }

      const result = await removeConfirmRoute.options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(CLOSURES_VIEWS.REMOVE_CONFIRM, {
        retentionDataId: '123',
        frn: FRN,
        agreementNumber: AGREEMENT_NUMBER,
        schemeName: 'SFI22'
      })

      expect(result).toBe(h)
    })

    test('validation failAction throws the validation error', () => {
      const routes = require('../../../../app/routes/closures')
      const removeConfirmRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.REMOVE_CONFIRM && route.method === 'GET'
      )

      const error = new Error('Invalid query')

      expect(() => removeConfirmRoute.options.validate.failAction({}, {}, error))
        .toThrow(error)
    })

    test('returns 403 when user lacks permission', async () => {
      auth.credentials.scope = []

      const url = `${CLOSURES_ROUTES.REMOVE_CONFIRM}?retentionDataId=123&frn=${FRN}&agreementNumber=${AGREEMENT_NUMBER}&schemeName=SFI22`

      const { res } = await loadPage('GET', url, auth)

      expect(res.statusCode).toBe(403)
    })

    test('redirects to login when unauthenticated', async () => {
      const url = `${CLOSURES_ROUTES.REMOVE_CONFIRM}?retentionDataId=123&frn=${FRN}&agreementNumber=${AGREEMENT_NUMBER}&schemeName=SFI22`

      const { res } = await loadPage('GET', url)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })

  describe('POST /closure/remove', () => {
    test('handler posts retention data and redirects back to search with removed flag', async () => {
      const routes = require('../../../../app/routes/closures')
      const removeRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.REMOVE && route.method === 'POST'
      )

      const h = {
        redirect: jest.fn(() => h)
      }

      const request = {
        payload: {
          retentionDataId: '123'
        }
      }

      const result = await removeRoute.options.handler(request, h)

      expect(postRetention).toHaveBeenCalledWith('/closure/remove', {
        retentionDataId: '123'
      })

      expect(h.redirect).toHaveBeenCalledWith(`${CLOSURES_ROUTES.SEARCH}?closureRemoved=true`)
      expect(result).toBe(h)
    })

    test('returns 403 when user lacks permission', async () => {
      auth.credentials.scope = []

      const res = await server.inject({
        method: 'POST',
        url: CLOSURES_ROUTES.REMOVE,
        auth,
        payload: {
          retentionDataId: '123'
        }
      })

      expect(res.statusCode).toBe(403)
      expect(postRetention).not.toHaveBeenCalled()
    })

    test('redirects to login when unauthenticated', async () => {
      const res = await server.inject({
        method: 'POST',
        url: CLOSURES_ROUTES.REMOVE,
        payload: {
          retentionDataId: '123'
        }
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
      expect(postRetention).not.toHaveBeenCalled()
    })
  })

  describe('GET /closure/extract', () => {
    test('returns 403 when user lacks permission', async () => {
      auth.credentials.scope = []

      const res = await server.inject({
        method: 'GET',
        url: CLOSURES_ROUTES.EXTRACT,
        auth
      })

      expect(res.statusCode).toBe(403)

      expect(getRetentionData).not.toHaveBeenCalled()
      expect(getRetentionExtractDownloadStreamAndDeleteAfter).not.toHaveBeenCalled()
    })

    test('redirects to login when unauthenticated', async () => {
      const res = await server.inject({
        method: 'GET',
        url: CLOSURES_ROUTES.EXTRACT
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })

    test('handler returns csv download response with filename and no-store cache header', async () => {
      const routes = require('../../../../app/routes/closures')
      const extractRoute = routes.find(route =>
        route.path === CLOSURES_ROUTES.EXTRACT && route.method === 'GET'
      )

      const stream = Readable.from(['frn,agreementNumber\n1234567890,SFI123\n'])

      getRetentionData.mockResolvedValue({
        payload: {
          filename: 'closures.csv'
        }
      })

      getRetentionExtractDownloadStreamAndDeleteAfter.mockResolvedValue({
        stream
      })

      const response = {
        type: jest.fn(() => response),
        header: jest.fn(() => response)
      }

      const h = {
        response: jest.fn(() => response)
      }

      const result = await extractRoute.options.handler({}, h)

      expect(getRetentionData).toHaveBeenCalledWith(CLOSURES_ROUTES.EXTRACT)
      expect(getRetentionExtractDownloadStreamAndDeleteAfter).toHaveBeenCalledWith('closures.csv')

      expect(h.response).toHaveBeenCalledWith(stream)
      expect(response.type).toHaveBeenCalledWith('text/csv')
      expect(response.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="closures.csv"')
      expect(response.header).toHaveBeenCalledWith('Cache-Control', 'no-store')
      expect(result).toBe(response)
    })
  })
})
