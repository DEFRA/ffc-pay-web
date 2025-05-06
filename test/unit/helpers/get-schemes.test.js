const api = require('../../../app/api')
const { getSchemes } = require('../../../app/helpers/get-schemes')

jest.mock('../../../app/api')

describe('get schemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch schemes and return them correctly', async () => {
    const mockSchemes = [
      { name: 'Scheme A' },
      { name: 'SFI' },
      { name: 'Scheme B' }
    ]

    api.get.mockResolvedValue({
      payload: {
        paymentSchemes: mockSchemes
      }
    })

    const result = await getSchemes()

    expect(api.get).toHaveBeenCalledWith('/payment-schemes')
    expect(result).toEqual([
      { name: 'Scheme A' },
      { name: 'Scheme B' },
      { name: 'SFI22' }
    ])
  })

  test('should rename SFI to SFI22 only', async () => {
    const mockSchemes = [
      { name: 'SFI' },
      { name: 'SFI' },
      { name: 'Non-SFI' }
    ]

    api.get.mockResolvedValue({
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

  test('should return an empty array if no schemes are available', async () => {
    api.get.mockResolvedValue({
      payload: {
        paymentSchemes: []
      }
    })

    const result = await getSchemes()

    expect(result).toEqual([])
  })

  test('should handle API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('API error'))

    await expect(getSchemes()).rejects.toThrow('API error')
  })
})
