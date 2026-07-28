jest.mock('../../../app/helpers/get-schemes', () => ({
  getSchemes: jest.fn()
}))

const { SFI, MANUAL, CS } = require('../../../app/constants/schemes')
const { getSchemes } = require('../../../app/helpers/get-schemes')
const { getSchemesForClosures } = require('../../../app/helpers/get-schemes-for-closures')

describe('getSchemesForClosures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call getSchemes', async () => {
    getSchemes.mockResolvedValue([])

    await getSchemesForClosures()

    expect(getSchemes).toHaveBeenCalled()
  })

  test('should remove manual schemes from the result', async () => {
    const schemes = [
      { schemeId: SFI },
      { schemeId: MANUAL },
      { schemeId: CS }
    ]

    getSchemes.mockResolvedValue(schemes)

    const result = await getSchemesForClosures()

    expect(result).toEqual([
      { schemeId: SFI },
      { schemeId: CS }
    ])
  })

  test('should return all schemes when no manual scheme exists', async () => {
    const schemes = [
      { schemeId: SFI },
      { schemeId: CS }
    ]

    getSchemes.mockResolvedValue(schemes)

    const result = await getSchemesForClosures()

    expect(result).toEqual(schemes)
  })
})
