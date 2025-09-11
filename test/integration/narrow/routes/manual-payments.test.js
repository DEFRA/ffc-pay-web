jest.mock('../../../../app/api')
jest.mock('../../../../app/storage')
jest.mock('../../../../app/helpers/read-file-content')
jest.mock('../../../../app/helpers/set-loading-status')
jest.mock('../../../../app/auth')

const { postInjection } = require('../../../../app/api')
const { uploadManualPaymentFile } = require('../../../../app/storage')
const { readFileContent } = require('../../../../app/helpers/read-file-content')
const cheerio = require('cheerio')
const createServer = require('../../../../app/server')

const { manualPaymentsAdmin } = require('../../../../app/auth/permissions')
const getCrumbs = require('../../../helpers/get-crumbs')

let server

function buildMultipartPayload ({ fields = {}, fileFieldName = 'file', filename = 'test-file.txt', fileContent = 'test content', boundary = '----WebKitFormBoundaryPovBlTQYGDYVuINo' } = {}) {
  const parts = []

  for (const [name, value] of Object.entries(fields)) {
    parts.push(`--${boundary}`)
    parts.push(`Content-Disposition: form-data; name="${name}"`)
    parts.push('', String(value))
  }

  parts.push(`--${boundary}`)
  parts.push(`Content-Disposition: form-data; name="${fileFieldName}"; filename="${filename}"`)
  parts.push('Content-Type: application/octet-stream')
  parts.push('', fileContent)

  parts.push(`--${boundary}--`)
  return { payload: parts.join('\r\n'), boundary }
}

describe('Manual Payments Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks()

    readFileContent.mockReturnValue('file-contents')
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockResolvedValue({ jobId: '12345' })

    server = await createServer()
    if (typeof server.initialize === 'function') await server.initialize()
  })

  afterEach(async () => {
    if (server && typeof server.stop === 'function') await server.stop()
  })

  test('GET /manual-payments returns 200 and correct view', async () => {
    const auth = { strategy: 'session-auth', credentials: { scope: [manualPaymentsAdmin] } }
    const res = await server.inject({ method: 'GET', url: '/manual-payments', auth })

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toContain('Manual payments portal')
  })

  test('POST /manual-payments/upload with file exceeding MAX_BYTES triggers failAction (413 -> 400)', async () => {
    const auth = { strategy: 'session-auth', credentials: { scope: [manualPaymentsAdmin] } }
    const mockForCrumbs = () => {}
    const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, '/manual-payments', auth)

    const largeContent = Buffer.alloc(1048577).fill('a') // 1MB + 1 byte
    const { payload, boundary } = buildMultipartPayload({
      fields: { crumb: viewCrumb },
      filename: 'too-large.txt',
      fileContent: largeContent
    })

    const res = await server.inject({
      method: 'POST',
      url: '/manual-payments/upload',
      payload,
      headers: {
        cookie: `crumb=${cookieCrumb}`,
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      auth
    })

    expect(res.statusCode).toBe(400)
    const $ = cheerio.load(res.payload)
    expect(res.payload).toContain('The uploaded file is too large. Please upload a file smaller than 1 MB.')
    expect($('.govuk-error-summary__body').text().toLowerCase()).toContain('too large')
  })
})
