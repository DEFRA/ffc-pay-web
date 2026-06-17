const api = require('../../../app/api')
const { getSchemes } = require('../../../app/helpers/get-schemes')

jest.mock('../../../app/api')

describe('getSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('fetches schemes and renames SFI to SFI22, and Vet Visits to AHWR', async () => {
    const mockSchemes = [
      { name: 'Scheme A' },
      { name: 'SFI' },
      { name: 'Vet Visits' }
    ]

    api.getProcessingData.mockResolvedValue({
      payload: {
        paymentSchemes: mockSchemes
      }
    })

    const result = await getSchemes()

    expect(result).toEqual([
      { name: 'Annual Health and Welfare Review' },
      { name: 'Scheme A' },
      { name: 'SFI22' }
    ])
  })

  test('renames multiple SFI schemes to SFI22', async () => {
    const mockSchemes = [
      { name: 'SFI' },
      { name: 'SFI' },
      { name: 'Non-SFI' }
    ]

    api.getProcessingData.mockResolvedValue({
      payload: {
        paymentSchemes: mockSchemes
      }
    })

    const result = await getSchemes()

    expect(result).toEqual([
      { name: 'Non-SFI' },
      { name: 'SFI22' },
      { name: 'SFI22' }
    ])
  })

  test('returns an empty array when no schemes exist', async () => {
    api.getProcessingData.mockResolvedValue({
      payload: { paymentSchemes: [] }
    })

    const result = await getSchemes()
    expect(result).toEqual([])
  })

  test('throws error when API call fails', async () => {
    api.getProcessingData.mockRejectedValue(new Error('API error'))
    await expect(getSchemes()).rejects.toThrow('API error')
  })
})
