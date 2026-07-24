const { getClosures } = require('../../../app/closure')
jest.mock('../../../app/api.js')
const { getRetentionData } = require('../../../app/api')
const { AGREEMENT_NUMBER } = require('../../mocks/values/agreement-number')
const { FRN } = require('../../mocks/values/frn')

describe('Get closures', () => {
  let mockClosures = [{
    frn: FRN,
    agreementNumber: AGREEMENT_NUMBER,
    schemeName: 'SFI22',
    endDate: '12/12/2023'
  }]

  const mockGetClosures = (closures, count = closures.length) => {
    getRetentionData.mockResolvedValue({ payload: { closures, count } })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    mockClosures = [{
      frn: FRN,
      agreementNumber: AGREEMENT_NUMBER,
      schemeName: 'SFI22',
      endDate: '12/12/2023'
    }]
  })

  test('Should return closures from the payload', async () => {
    mockGetClosures(mockClosures)
    const result = await getClosures()
    expect(result.closures[0]).toBe(mockClosures[0])
    expect(result.count).toBe(1)
  })

  test('Should return closures from the payload even if empty array', async () => {
    mockGetClosures([])
    const result = await getClosures()
    expect(result.closures[0]).toBeUndefined()
    expect(result.count).toBe(0)
  })

  test('Closure date should be reformatted to correct dd/mm/yyyy', async () => {
    mockClosures[0].endDate = '2023-12-12'
    mockGetClosures(mockClosures)
    const result = await getClosures()
    expect(result.closures[0].endDate).toBe('12/12/2023')
  })

  test('Scheme name SFI should be reformatted to correct SFI22', async () => {
    mockClosures[0].schemeName = 'SFI'
    mockGetClosures(mockClosures)
    const result = await getClosures()
    expect(result.closures[0].schemeName).toBe('SFI22')
  })

  test('URL params include frnAgreement only if provided', async () => {
    mockGetClosures(mockClosures)
    await getClosures({ frnAgreement: 'FRN_VAL' })
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('frnAgreement=FRN_VAL'))
    expect(getRetentionData).not.toHaveBeenCalledWith(expect.stringContaining('schemeId='))
  })

  test('URL params include schemeId only if provided', async () => {
    mockGetClosures(mockClosures)
    await getClosures({ schemeId: 'SCHEME_ID' })
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('schemeId=SCHEME_ID'))
    expect(getRetentionData).not.toHaveBeenCalledWith(expect.stringContaining('frnAgreement='))
  })

  test('URL params include both frnAgreement and schemeId if both provided', async () => {
    mockGetClosures(mockClosures)
    await getClosures({ frnAgreement: 'FRN_VAL', schemeId: 'SCHEME_ID' })
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('frnAgreement=FRN_VAL'))
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('schemeId=SCHEME_ID'))
  })

  test('URL params include pagination when neither frnAgreement nor schemeId provided', async () => {
    mockGetClosures(mockClosures)
    await getClosures({ page: 2, pageSize: 50 })
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('page=2'))
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('pageSize=50'))
  })

  test('URL params default pagination when no params provided', async () => {
    mockGetClosures(mockClosures)
    await getClosures({})
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('page=1'))
    expect(getRetentionData).toHaveBeenCalledWith(expect.stringContaining('pageSize=2500'))
  })

  test('Returns empty closures and count 0 if payload.closures undefined', async () => {
    getRetentionData.mockResolvedValue({ payload: {} })
    const result = await getClosures()
    expect(result.closures).toEqual([])
    expect(result.count).toBe(0)
  })
})
