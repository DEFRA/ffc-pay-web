jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/storage', () => ({
  getRetentionExtractDownloadStreamAndDeleteAfter: jest.fn()
}))

const cheerio = require('cheerio')
const createServer = require('../../../../app/server')
const { applicationAdmin } = require('../../../../app/auth/permissions')
const { postRetention } = require('../../../../app/api')
const { MANAGE } = require('../../../../app/constants/closures-routes')
const { CLOSURE_MAX_BYTES } = require('../../../../app/constants/payload-sizes')
const { buildClosureCsv, uploadClosureCsv } = require('../../../helpers/bulk-closure-upload')

const ADDED_BY = 'Closure Tester'
const LARGE_FILE_ROWS = 11000
const ONE_MEGA_BYTE = 1024 * 1024

const getErrors = (res) => {
  const $ = cheerio.load(res.payload)
  return $('.govuk-error-summary__list li').map((_, el) => $(el).text().trim()).get()
}

const getSentRows = () => postRetention.mock.calls[0][1].data

describe('Bulk closure upload: CSV file through the web route to the retention API call', () => {
  let server
  let auth

  beforeEach(async () => {
    jest.clearAllMocks()
    postRetention.mockResolvedValue('ok')
    auth = {
      strategy: 'session-auth',
      credentials: { scope: [applicationAdmin], account: { name: ADDED_BY } }
    }
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('accepts a file saved by Excel as "CSV UTF-8" (with a byte order mark) and sends the scheme without it', async () => {
    const csv = buildClosureCsv([
      ['SFI', '1234567890', 'AGR0001', '2024-11-12'],
      ['ESFIO', '9876543210', 'AGR0002', '2024-11-09']
    ], { bom: true })

    const res = await uploadClosureCsv(server, auth, csv)

    expect(getErrors(res)).toEqual([])
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe(`${MANAGE}?closureAdded=bulk`)
    expect(postRetention).toHaveBeenCalledTimes(1)
    expect(postRetention).toHaveBeenCalledWith('/closure/bulk', {
      data: [
        { sourceSystem: 'SFI', frn: '1234567890', agreementNumber: 'AGR0001', closureDate: '2024-11-12' },
        { sourceSystem: 'ESFIO', frn: '9876543210', agreementNumber: 'AGR0002', closureDate: '2024-11-09' }
      ],
      addedBy: ADDED_BY
    }, null)
  })

  test.each([
    ['DD/MM/YYYY', '12/11/2024', '2024-11-12'],
    ['D/M/YYYY', '1/2/2025', '2025-02-01'],
    ['DD-MM-YYYY', '12-11-2024', '2024-11-12'],
    ['YYYY/MM/DD', '2024/11/12', '2024-11-12'],
    ['YYYY-MM-DD', '2024-11-12', '2024-11-12']
  ])('accepts a %s closure date (%s) and sends it as %s', async (_format, closureDate, expected) => {
    const res = await uploadClosureCsv(server, auth, buildClosureCsv([['IMPS', '1234567890', 'AGR0001', closureDate]]))

    expect(getErrors(res)).toEqual([])
    expect(res.statusCode).toBe(302)
    expect(getSentRows()[0].closureDate).toBe(expected)
  })

  test.each([
    ['an impossible date', '31/02/2024'],
    ['a US-style date', '11/31/2024'],
    ['a two-digit year', '12/11/24']
  ])('rejects %s (%s) without calling the retention API', async (_description, closureDate) => {
    const res = await uploadClosureCsv(server, auth, buildClosureCsv([['IMPS', '1234567890', 'AGR0001', closureDate]]))

    expect(res.statusCode).toBe(400)
    expect(getErrors(res)).toContain('Enter a valid date')
    expect(postRetention).not.toHaveBeenCalled()
  })

  test('accepts a 50 character agreement number', async () => {
    const agreementNumber = 'A'.repeat(50)

    const res = await uploadClosureCsv(server, auth, buildClosureCsv([['IMPS', '1234567890', agreementNumber, '2024-11-12']]))

    expect(res.statusCode).toBe(302)
    expect(getSentRows()[0].agreementNumber).toBe(agreementNumber)
  })

  test('rejects a 51 character agreement number without calling the retention API', async () => {
    const res = await uploadClosureCsv(server, auth, buildClosureCsv([['IMPS', '1234567890', 'A'.repeat(51), '2024-11-12']]))

    expect(res.statusCode).toBe(400)
    expect(getErrors(res)).toContain('Enter a valid agreement number')
    expect(postRetention).not.toHaveBeenCalled()
  })

  test(`accepts an ${LARGE_FILE_ROWS} row IMPS file and sends every row in a single request`, async () => {
    const rows = Array.from({ length: LARGE_FILE_ROWS }, (_, i) => [
      'IMPS',
      String(1000000000 + i),
      `IMPS-AGREEMENT-${String(i).padStart(20, '0')}`,
      '12/11/2024'
    ])

    const res = await uploadClosureCsv(server, auth, buildClosureCsv(rows, { bom: true }))

    expect(getErrors(res)).toEqual([])
    expect(res.statusCode).toBe(302)
    const sent = getSentRows()
    expect(sent).toHaveLength(LARGE_FILE_ROWS)
    expect(sent[LARGE_FILE_ROWS - 1]).toEqual({
      sourceSystem: 'IMPS',
      frn: String(1000000000 + LARGE_FILE_ROWS - 1),
      agreementNumber: `IMPS-AGREEMENT-${String(LARGE_FILE_ROWS - 1).padStart(20, '0')}`,
      closureDate: '2024-11-12'
    })
    // This is the request body size that the retention service previously rejected (hapi's 1MB default)
    expect(Buffer.byteLength(JSON.stringify(postRetention.mock.calls[0][1]))).toBeGreaterThan(ONE_MEGA_BYTE)
  })

  test('accepts a CSV file larger than the previous 1MB upload limit', async () => {
    const rowCount = 20000
    const rows = Array.from({ length: rowCount }, (_, i) => ['IMPS', String(1000000000 + i), `IMPS-AGREEMENT-${String(i).padStart(20, '0')}`, '2024-11-12'])
    const csv = buildClosureCsv(rows)
    expect(csv.length).toBeGreaterThan(ONE_MEGA_BYTE)

    const res = await uploadClosureCsv(server, auth, csv)

    expect(res.statusCode).toBe(302)
    expect(getSentRows()).toHaveLength(rowCount)
  })

  test('rejects a file larger than the closure upload limit with a message', async () => {
    const csv = Buffer.alloc(CLOSURE_MAX_BYTES + 1, 'a')

    const res = await uploadClosureCsv(server, auth, csv)

    expect(res.statusCode).toBe(400)
    expect(getErrors(res)).toContain('The uploaded file is too large. Please upload a file smaller than 5 MB.')
    expect(postRetention).not.toHaveBeenCalled()
  })
})
