const { getAlertTypesAndSchemes } = require('../../../app/alerts')
const { getAlertingData } = require('../../../app/api')
const { getSchemes } = require('../../../app/helpers')

jest.mock('../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

jest.mock('../../../app/helpers', () => ({
  getSchemes: jest.fn()
}))

describe('getAlertTypesAndSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns schemes and alert types when alerting data is present', async () => {
    const schemes = ['scheme-a', 'scheme-b']
    const alertTypes = [
      { id: 'type-1', name: 'Alert type 1' },
      { id: 'type-2', name: 'Alert type 2' }
    ]

    getSchemes.mockReturnValue(schemes)
    getAlertingData.mockResolvedValue({
      payload: {
        alertTypes
      }
    })

    const result = await getAlertTypesAndSchemes()

    expect(getSchemes).toHaveBeenCalledTimes(1)
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(result).toEqual({
      schemes,
      alertTypesPayload: alertTypes
    })
  })

  test('returns an empty alertTypesPayload when the API response has no payload', async () => {
    const schemes = ['scheme-a']

    getSchemes.mockReturnValue(schemes)
    getAlertingData.mockResolvedValue({})

    const result = await getAlertTypesAndSchemes()

    expect(result).toEqual({
      schemes,
      alertTypesPayload: []
    })
  })

  test('returns an empty alertTypesPayload when the API response is undefined', async () => {
    const schemes = ['scheme-a']

    getSchemes.mockReturnValue(schemes)
    getAlertingData.mockResolvedValue(undefined)

    const result = await getAlertTypesAndSchemes()

    expect(result).toEqual({
      schemes,
      alertTypesPayload: []
    })
  })
})
