const { getHoldCategories } = require('../../app/holds')
const { mockPaymentHoldCategories } = require('../mocks/objects/holds')
jest.mock('../../app/api')
const { getProcessingData } = require('../../app/api')

describe('Get hold categories', () => {
  const setupMock = (categories) => getProcessingData.mockResolvedValue({ payload: { paymentHoldCategories: categories } })

  afterEach(() => jest.clearAllMocks())

  test.each([
    ['Vet Visits', 'Annual Health and Welfare Review'],
    ['SFI', 'SFI22'],
    ['SFI Pilot', 'SFI Pilot'],
    ['Lump Sums', 'Lump Sums'],
    ['LNR', 'LNR']
  ])('maps "%s" to "%s"', async (input, expected) => {
    mockPaymentHoldCategories[0].schemeName = input
    setupMock(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0].name).toBe(expected)
  })

  test('handles empty categories', async () => {
    setupMock([])
    const result = await getHoldCategories()
    expect(result.schemes).toEqual([])
    expect(result.paymentHoldCategories).toEqual([])
  })

  test('handles missing schemeName', async () => {
    mockPaymentHoldCategories[0].schemeName = undefined
    setupMock(mockPaymentHoldCategories)
    const result = await getHoldCategories()
    expect(result.schemes[0].name).toBeUndefined()
  })
})
