const { getClosures } = require('../../../app/closure')
jest.mock('../../../app/api.js')
const { getProcessingData } = require('../../../app/api')
const { AGREEMENT_NUMBER } = require('../../mocks/values/agreement-number')
const { FRN } = require('../../mocks/values/frn')

describe('Get closures', () => {
  let mockClosures = [{
    frn: FRN,
    agreementNumber: AGREEMENT_NUMBER,
    schemeName: 'SFI22',
    closureDate: '12/12/2023'
  }]

  const mockGetClosures = (closures) => {
    getProcessingData.mockResolvedValue({ payload: { closures } })
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  afterEach(async () => {
    mockClosures = [{
      frn: FRN,
      agreementNumber: AGREEMENT_NUMBER,
      schemeName: 'SFI22',
      closureDate: '12/12/2023'
    }]
  })

  test('Should return closures from the payload', async () => {
    mockGetClosures(mockClosures)
    const result = await getClosures()
    expect(result[0]).toBe(mockClosures[0])
  })

  test('Should return closures from the payload even if empty array', async () => {
    mockGetClosures([])
    const result = await getClosures()
    expect(result[0]).toBe(undefined)
  })

  test('Closure date should be reformatted to correct dd/mm/yyyy', async () => {
    mockClosures[0].closureDate = '2023-12-12'
    mockGetClosures(mockClosures)
    const result = await getClosures()
    expect(result[0].closureDate).toBe('12/12/2023')
  })

  test('Scheme name SFI should be reformatted to correct SFI22', async () => {
    mockClosures[0].schemeName = 'SFI'
    mockGetClosures(mockClosures)
    const result = await getClosures()
    expect(result[0].schemeName).toBe('SFI22')
  })
})
