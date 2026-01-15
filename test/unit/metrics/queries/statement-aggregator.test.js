jest.mock('../../../../app/api')

const { getStatementMetrics } = require('../../../../app/metrics/queries/statement-aggregator')
const { getStatementPublisherData } = require('../../../../app/api')

describe('statement-aggregator', () => {
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('getStatementMetrics', () => {
    const mockPayload = {
      totalStatements: 200,
      totalPrintPost: 120,
      totalPrintPostCost: '15000',
      totalEmail: 80,
      totalFailures: 5,
      statementsByScheme: [
        {
          schemeName: 'SFI',
          schemeYear: 2024,
          totalStatements: 120,
          printPostCount: 70,
          printPostCost: '9000',
          emailCount: 50
        },
        {
          schemeName: 'BPS',
          schemeYear: 2024,
          totalStatements: 80,
          printPostCount: 50,
          printPostCost: '6000',
          emailCount: 30
        }
      ]
    }

    describe('successful requests', () => {
      beforeEach(() => {
        getStatementPublisherData.mockResolvedValue(mockPayload)
      })

      test('should fetch document metrics with default period ytd', async () => {
        const result = await getStatementMetrics()

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=ytd')
        expect(result.error).toBe(false)
        expect(result.message).toBe('')
        expect(result.data).toBeDefined()
      })

      test('should fetch document metrics with custom period', async () => {
        await getStatementMetrics('month')

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=month')
      })

      test('should fetch document metrics with period year and schemeYear', async () => {
        await getStatementMetrics('year', 2024)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=year&schemeYear=2024')
      })

      test('should fetch document metrics with period monthInYear, schemeYear and month', async () => {
        await getStatementMetrics('monthInYear', 2024, 6)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=monthInYear&schemeYear=2024&month=6')
      })

      test('should not append schemeYear to URL when period is not year', async () => {
        await getStatementMetrics('ytd', 2024)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=ytd')
      })

      test('should not append month to URL when period is not monthInYear', async () => {
        await getStatementMetrics('year', 2024, 6)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=year&schemeYear=2024')
      })

      test('should not append schemeYear when it is null for year period', async () => {
        await getStatementMetrics('year', null)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=year')
      })

      test('should not append month when it is null for monthInYear period', async () => {
        await getStatementMetrics('monthInYear', 2024, null)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=monthInYear')
      })

      test('should return transformed document metrics data', async () => {
        const result = await getStatementMetrics('ytd')

        expect(result.data.totalStatements).toBe(200)
        expect(result.data.totalPrintPost).toBe(120)
        expect(result.data.totalPrintPostCost).toBe(15000)
        expect(result.data.totalEmail).toBe(80)
        expect(result.data.totalFailures).toBe(5)
      })

      test('should transform statementsByScheme array with parsed costs', async () => {
        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme).toHaveLength(2)
        expect(result.data.statementsByScheme[0]).toEqual({
          schemeName: 'SFI',
          schemeYear: 2024,
          totalStatements: 120,
          printPostCount: 70,
          printPostCost: 9000,
          emailCount: 50
        })
        expect(result.data.statementsByScheme[1]).toEqual({
          schemeName: 'BPS',
          schemeYear: 2024,
          totalStatements: 80,
          printPostCount: 50,
          printPostCost: 6000,
          emailCount: 30
        })
      })

      test('should parse totalPrintPostCost from string to integer', async () => {
        const payloadWithStringCost = {
          totalPrintPostCost: '25000',
          statementsByScheme: []
        }
        getStatementPublisherData.mockResolvedValue(payloadWithStringCost)

        const result = await getStatementMetrics('ytd')

        expect(result.data.totalPrintPostCost).toBe(25000)
      })

      test('should parse printPostCost for each scheme from string to integer', async () => {
        const payloadWithStringCosts = {
          statementsByScheme: [
            {
              schemeName: 'SFI',
              printPostCost: '12345'
            },
            {
              schemeName: 'BPS',
              printPostCost: '67890'
            }
          ]
        }
        getStatementPublisherData.mockResolvedValue(payloadWithStringCosts)

        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme[0].printPostCost).toBe(12345)
        expect(result.data.statementsByScheme[1].printPostCost).toBe(67890)
      })

      test('should handle invalid totalPrintPostCost as zero', async () => {
        const payloadWithInvalidCost = {
          totalPrintPostCost: 'invalid',
          statementsByScheme: []
        }
        getStatementPublisherData.mockResolvedValue(payloadWithInvalidCost)

        const result = await getStatementMetrics('ytd')

        expect(result.data.totalPrintPostCost).toBe(0)
      })

      test('should handle invalid printPostCost in scheme as zero', async () => {
        const payloadWithInvalidSchemeCost = {
          statementsByScheme: [
            {
              schemeName: 'SFI',
              printPostCost: 'not-a-number'
            }
          ]
        }
        getStatementPublisherData.mockResolvedValue(payloadWithInvalidSchemeCost)

        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme[0].printPostCost).toBe(0)
      })

      test('should handle zero values correctly', async () => {
        const payloadWithZeros = {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: '0',
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        }
        getStatementPublisherData.mockResolvedValue(payloadWithZeros)

        const result = await getStatementMetrics('ytd')

        expect(result.data.totalStatements).toBe(0)
        expect(result.data.totalPrintPost).toBe(0)
        expect(result.data.totalPrintPostCost).toBe(0)
        expect(result.data.totalEmail).toBe(0)
        expect(result.data.totalFailures).toBe(0)
      })

      test('should preserve all scheme properties', async () => {
        const payloadWithAllProperties = {
          statementsByScheme: [
            {
              schemeName: 'SFI',
              schemeYear: 2024,
              totalStatements: 100,
              printPostCount: 60,
              printPostCost: '7500',
              emailCount: 40,
              customProperty: 'value'
            }
          ]
        }
        getStatementPublisherData.mockResolvedValue(payloadWithAllProperties)

        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme[0]).toEqual({
          schemeName: 'SFI',
          schemeYear: 2024,
          totalStatements: 100,
          printPostCount: 60,
          printPostCost: 7500,
          emailCount: 40,
          customProperty: 'value'
        })
      })

      test('should handle period year with schemeYear zero', async () => {
        await getStatementMetrics('year', 0)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=year')
      })

      test('should handle period monthInYear with month zero', async () => {
        await getStatementMetrics('monthInYear', 2024, 0)

        expect(getStatementPublisherData).toHaveBeenCalledWith('/metrics?period=monthInYear')
      })

      test('should handle empty statementsByScheme array', async () => {
        const payloadWithEmptySchemes = {
          totalStatements: 100,
          statementsByScheme: []
        }
        getStatementPublisherData.mockResolvedValue(payloadWithEmptySchemes)

        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme).toEqual([])
      })

      test('should handle scheme without printPostCost', async () => {
        const payloadWithoutCost = {
          statementsByScheme: [
            {
              schemeName: 'SFI',
              totalStatements: 50
            }
          ]
        }
        getStatementPublisherData.mockResolvedValue(payloadWithoutCost)

        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme[0].printPostCost).toBe(0)
      })

      test('should spread all payload properties into data', async () => {
        const payloadWithExtraProperties = {
          totalStatements: 100,
          totalPrintPost: 60,
          totalPrintPostCost: '8000',
          totalEmail: 40,
          totalFailures: 2,
          extraField1: 'value1',
          extraField2: 123,
          statementsByScheme: []
        }
        getStatementPublisherData.mockResolvedValue(payloadWithExtraProperties)

        const result = await getStatementMetrics('ytd')

        expect(result.data.totalStatements).toBe(100)
        expect(result.data.totalPrintPost).toBe(60)
        expect(result.data.totalPrintPostCost).toBe(8000)
        expect(result.data.totalEmail).toBe(40)
        expect(result.data.totalFailures).toBe(2)
        expect(result.data.extraField1).toBe('value1')
        expect(result.data.extraField2).toBe(123)
      })
    })

    describe('error handling', () => {
      test('should return error structure when API call fails', async () => {
        getStatementPublisherData.mockRejectedValue(new Error('API connection failed'))

        const result = await getStatementMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching document metrics:', expect.any(Error))
        expect(result.error).toBe(true)
        expect(result.message).toBe('Unable to load document metrics. Please try again later.')
        expect(result.data).toEqual({
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        })
      })

      test('should return empty data on network error', async () => {
        getStatementPublisherData.mockRejectedValue(new Error('Network error'))

        const result = await getStatementMetrics('ytd')

        expect(result.data.totalStatements).toBe(0)
      })

      test('should return empty statementsByScheme on error', async () => {
        getStatementPublisherData.mockRejectedValue(new Error('Database error'))

        const result = await getStatementMetrics('ytd')

        expect(result.data.statementsByScheme).toEqual([])
      })

      test('should handle API returning undefined payload by catching error', async () => {
        getStatementPublisherData.mockResolvedValue(undefined)

        const result = await getStatementMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(result.error).toBe(true)
        expect(result.message).toBe('Unable to load document metrics. Please try again later.')
        expect(result.data).toEqual({
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        })
      })

      test('should handle API returning null by catching error', async () => {
        getStatementPublisherData.mockResolvedValue(null)

        const result = await getStatementMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(result.error).toBe(true)
        expect(result.message).toBe('Unable to load document metrics. Please try again later.')
        expect(result.data).toEqual({
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        })
      })
    })
  })
})
