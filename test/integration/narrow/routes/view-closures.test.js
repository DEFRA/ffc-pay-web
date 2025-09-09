jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
const cheerio = require('cheerio')
const { closureAdmin } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')
const { FRN } = require('../../../mocks/values/frn')
const { AGREEMENT_NUMBER } = require('../../../mocks/values/agreement-number')
const { getProcessingData } = require('../../../../app/api')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
let auth

const mockClosures = [{
  frn: FRN,
  agreementNumber: AGREEMENT_NUMBER,
  schemeName: 'SFI22',
  closureDate: '2023-09-12'
}]
const mockGetClosures = (closures) => {
  getProcessingData.mockResolvedValue({ payload: { closures } })
}

describe('View and remove closures', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [closureAdmin] } }
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  const method = 'GET'
  const url = '/closure'
  const pageH1 = 'Agreement closures'

  test('returns 200 when load successful', async () => {
    mockGetClosures(mockClosures)

    const res = await server.inject({ method, url, auth })

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toEqual(pageH1)
  })

  test('returns 200 and no closures shown if response is empty', async () => {
    mockGetClosures([])

    const res = await server.inject({ method, url, auth })

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toEqual(pageH1)
    expect($('#no-closure-text').text()).toEqual('There are no agreement closures.')
  })

  test('returns 403 if no permission', async () => {
    auth.credentials.scope = []
    const res = await server.inject({ method, url, auth })
    expect(res.statusCode).toBe(403)
  })

  test('returns 302 no auth', async () => {
    const res = await server.inject({ method, url })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/login')
  })

  test('/closure/remove returns 302 and redirects to /', async () => {
    const mockForCrumbs = () => mockGetClosures(mockClosures)
    const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
    const res = await server.inject({
      method: 'POST',
      url: '/closure/remove',
      auth,
      payload: { crumb: viewCrumb, closedId: '1' },
      headers: { cookie: `crumb=${cookieCrumb}` }
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/closure')
  })
})
