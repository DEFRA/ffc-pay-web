jest.mock('ffc-pay-schemes', () => ({
  getSchemes: jest.fn()
}))

const { getSchemes: getUnorderedSchemes } = require('ffc-pay-schemes')
const { getSchemes } = require('../../../app/helpers/get-schemes')

describe('getSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns schemes sorted by schemeName', () => {
    getUnorderedSchemes.mockReturnValue([
      { schemeId: 3, schemeName: 'Zulu' },
      { schemeId: 1, schemeName: 'Alpha' },
      { schemeId: 2, schemeName: 'Bravo' }
    ])

    expect(getSchemes()).toEqual([
      { schemeId: 1, schemeName: 'Alpha' },
      { schemeId: 2, schemeName: 'Bravo' },
      { schemeId: 3, schemeName: 'Zulu' }
    ])

    expect(getUnorderedSchemes).toHaveBeenCalledTimes(1)
  })

  test('returns an empty array when no schemes are returned', () => {
    getUnorderedSchemes.mockReturnValue([])

    expect(getSchemes()).toEqual([])

    expect(getUnorderedSchemes).toHaveBeenCalledTimes(1)
  })
})
