jest.mock('../../../../app/api')

const { getPaymentMetrics } = require('../../../../app/metrics/queries/payment-aggregator')
const { getProcessingData } = require('../../../../app/api')

describe('payment-aggregator', () => {
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('getPaymentMetrics', () => {
    const mockPayload = {
      totalPayments: 150,
      totalValue: '50000',
      totalPendingPayments: 30,
      totalPendingValue: '10000',
      totalProcessedPayments: 100,
      totalProcessedValue: '35000',
      totalSettledPayments: 80,
      totalSettledValue: '28000',
      totalPaymentsOnHold: 20,
      totalValueOnHold: '5000',
      paymentsByScheme: [
        {
          schemeName: 'SFI',
          schemeYear: 2024,
          totalPayments: 100,
          totalValue: '30000',
          pendingPayments: 20,
          processedPayments: 80
        },
        {
          schemeName: 'BPS',
          schemeYear: 2024,
          totalPayments: 50,
          totalValue: '20000',
          pendingPayments: 10,
          processedPayments: 40
        }
      ]
    }

    describe('successful requests', () => {
      beforeEach(() => {
        getProcessingData.mockResolvedValue({ payload: mockPayload })
      })

      test('should fetch payment metrics with default period ytd', async () => {
        const result = await getPaymentMetrics()

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=ytd')
        expect(result.error).toBe(false)
        expect(result.message).toBe('')
        expect(result.data).toBeDefined()
      })

      test('should fetch payment metrics with custom period', async () => {
        await getPaymentMetrics('month')

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=month')
      })

      test('should fetch payment metrics with period year and schemeYear', async () => {
        await getPaymentMetrics('year', 2024)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=year&schemeYear=2024')
      })

      test('should fetch payment metrics with period monthInYear, schemeYear and month', async () => {
        await getPaymentMetrics('monthInYear', 2024, 6)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=monthInYear&schemeYear=2024&month=6')
      })

      test('should not append schemeYear to URL when period is not year', async () => {
        await getPaymentMetrics('ytd', 2024)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=ytd')
      })

      test('should not append month to URL when period is not monthInYear', async () => {
        await getPaymentMetrics('year', 2024, 6)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=year&schemeYear=2024')
      })

      test('should not append schemeYear when it is null for year period', async () => {
        await getPaymentMetrics('year', null)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=year')
      })

      test('should not append month when it is null for monthInYear period', async () => {
        await getPaymentMetrics('monthInYear', 2024, null)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=monthInYear')
      })

      test('should return transformed payment metrics data', async () => {
        const result = await getPaymentMetrics('ytd')

        expect(result.data.totalPayments).toBe(150)
        expect(result.data.totalValue).toBe(50000)
        expect(result.data.totalPendingPayments).toBe(30)
        expect(result.data.totalPendingValue).toBe(10000)
        expect(result.data.totalProcessedPayments).toBe(100)
        expect(result.data.totalProcessedValue).toBe(35000)
        expect(result.data.totalSettledPayments).toBe(80)
        expect(result.data.totalSettledValue).toBe(28000)
        expect(result.data.totalPaymentsOnHold).toBe(20)
        expect(result.data.totalValueOnHold).toBe(5000)
      })

      test('should transform paymentsByScheme array', async () => {
        const result = await getPaymentMetrics('ytd')

        expect(result.data.paymentsByScheme).toHaveLength(2)
        expect(result.data.paymentsByScheme[0]).toEqual({
          schemeName: 'SFI',
          schemeYear: 2024,
          totalPayments: 100,
          totalValue: 30000,
          paymentsByStatus: {
            pending: 20,
            processed: 80
          }
        })
        expect(result.data.paymentsByScheme[1]).toEqual({
          schemeName: 'BPS',
          schemeYear: 2024,
          totalPayments: 50,
          totalValue: 20000,
          paymentsByStatus: {
            pending: 10,
            processed: 40
          }
        })
      })

      test('should handle missing optional fields in payload', async () => {
        const minimalPayload = {
          paymentsByScheme: []
        }
        getProcessingData.mockResolvedValue({ payload: minimalPayload })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.totalPayments).toBe(0)
        expect(result.data.totalValue).toBe(0)
        expect(result.data.totalPendingPayments).toBe(0)
        expect(result.data.totalPendingValue).toBe(0)
        expect(result.data.totalProcessedPayments).toBe(0)
        expect(result.data.totalProcessedValue).toBe(0)
        expect(result.data.totalSettledPayments).toBe(0)
        expect(result.data.totalSettledValue).toBe(0)
        expect(result.data.totalPaymentsOnHold).toBe(0)
        expect(result.data.totalValueOnHold).toBe(0)
        expect(result.data.paymentsByScheme).toEqual([])
      })

      test('should handle missing paymentsByScheme in payload', async () => {
        const payloadWithoutSchemes = {
          totalPayments: 100,
          totalValue: '25000'
        }
        getProcessingData.mockResolvedValue({ payload: payloadWithoutSchemes })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.paymentsByScheme).toEqual([])
      })

      test('should handle scheme with missing optional fields', async () => {
        const payloadWithMinimalScheme = {
          paymentsByScheme: [
            {
              schemeName: 'SFI'
            }
          ]
        }
        getProcessingData.mockResolvedValue({ payload: payloadWithMinimalScheme })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.paymentsByScheme[0]).toEqual({
          schemeName: 'SFI',
          schemeYear: undefined,
          totalPayments: 0,
          totalValue: 0,
          paymentsByStatus: {
            pending: 0,
            processed: 0
          }
        })
      })

      test('should parse string values to integers', async () => {
        const payloadWithStrings = {
          totalValue: '123456',
          totalPendingValue: '10000',
          totalProcessedValue: '50000',
          totalSettledValue: '30000',
          totalValueOnHold: '5000',
          paymentsByScheme: [
            {
              schemeName: 'SFI',
              totalValue: '99999'
            }
          ]
        }
        getProcessingData.mockResolvedValue({ payload: payloadWithStrings })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.totalValue).toBe(123456)
        expect(result.data.totalPendingValue).toBe(10000)
        expect(result.data.totalProcessedValue).toBe(50000)
        expect(result.data.totalSettledValue).toBe(30000)
        expect(result.data.totalValueOnHold).toBe(5000)
        expect(result.data.paymentsByScheme[0].totalValue).toBe(99999)
      })

      test('should handle invalid string values as zero', async () => {
        const payloadWithInvalidStrings = {
          totalValue: 'invalid',
          totalPendingValue: 'not-a-number',
          paymentsByScheme: [
            {
              schemeName: 'SFI',
              totalValue: 'abc'
            }
          ]
        }
        getProcessingData.mockResolvedValue({ payload: payloadWithInvalidStrings })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.totalValue).toBe(0)
        expect(result.data.totalPendingValue).toBe(0)
        expect(result.data.paymentsByScheme[0].totalValue).toBe(0)
      })

      test('should handle zero values correctly', async () => {
        const payloadWithZeros = {
          totalPayments: 0,
          totalValue: '0',
          totalPendingPayments: 0,
          totalPendingValue: '0',
          paymentsByScheme: []
        }
        getProcessingData.mockResolvedValue({ payload: payloadWithZeros })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.totalPayments).toBe(0)
        expect(result.data.totalValue).toBe(0)
        expect(result.data.totalPendingPayments).toBe(0)
        expect(result.data.totalPendingValue).toBe(0)
      })

      test('should handle period year with schemeYear zero', async () => {
        await getPaymentMetrics('year', 0)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=year')
      })

      test('should handle period monthInYear with month zero', async () => {
        await getPaymentMetrics('monthInYear', 2024, 0)

        expect(getProcessingData).toHaveBeenCalledWith('/metrics?period=monthInYear')
      })

      test('should handle empty paymentsByScheme array', async () => {
        const payloadWithEmptySchemes = {
          totalPayments: 100,
          paymentsByScheme: []
        }
        getProcessingData.mockResolvedValue({ payload: payloadWithEmptySchemes })

        const result = await getPaymentMetrics('ytd')

        expect(result.data.paymentsByScheme).toEqual([])
      })
    })

    describe('error handling', () => {
      test('should return error structure when API call fails', async () => {
        const error = new Error('API connection failed')
        getProcessingData.mockRejectedValue(error)

        const result = await getPaymentMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching payment metrics:', 'API connection failed')
        expect(result.error).toBe(true)
        expect(result.message).toBe('Unable to load payment metrics. Please try again later.')
        expect(result.data).toEqual({
          totalPayments: 0,
          totalValue: 0,
          totalPendingPayments: 0,
          totalPendingValue: 0,
          totalProcessedPayments: 0,
          totalProcessedValue: 0,
          totalSettledPayments: 0,
          totalSettledValue: 0,
          totalPaymentsOnHold: 0,
          totalValueOnHold: 0,
          paymentsByScheme: []
        })
      })

      test('should handle network errors', async () => {
        const error = new Error('Network timeout')
        getProcessingData.mockRejectedValue(error)

        const result = await getPaymentMetrics('year', 2024)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching payment metrics:', 'Network timeout')
        expect(result.error).toBe(true)
      })

      test('should handle errors without message property', async () => {
        const error = { code: 'ECONNREFUSED' }
        getProcessingData.mockRejectedValue(error)

        const result = await getPaymentMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(result.error).toBe(true)
      })

      test('should handle error for different period types', async () => {
        const error = new Error('Service unavailable')
        getProcessingData.mockRejectedValue(error)

        const result = await getPaymentMetrics('monthInYear', 2024, 6)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching payment metrics:', 'Service unavailable')
        expect(result.error).toBe(true)
      })

      test('should return empty paymentsByScheme on error', async () => {
        getProcessingData.mockRejectedValue(new Error('Database error'))

        const result = await getPaymentMetrics('ytd')

        expect(result.data.paymentsByScheme).toEqual([])
      })

      test('should handle API returning undefined payload by catching error', async () => {
        getProcessingData.mockResolvedValue({})

        const result = await getPaymentMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(result.error).toBe(true)
        expect(result.message).toBe('Unable to load payment metrics. Please try again later.')
        expect(result.data).toEqual({
          totalPayments: 0,
          totalValue: 0,
          totalPendingPayments: 0,
          totalPendingValue: 0,
          totalProcessedPayments: 0,
          totalProcessedValue: 0,
          totalSettledPayments: 0,
          totalSettledValue: 0,
          totalPaymentsOnHold: 0,
          totalValueOnHold: 0,
          paymentsByScheme: []
        })
      })

      test('should handle API returning null by catching error', async () => {
        getProcessingData.mockResolvedValue(null)

        const result = await getPaymentMetrics('ytd')

        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(result.error).toBe(true)
        expect(result.message).toBe('Unable to load payment metrics. Please try again later.')
        expect(result.data).toEqual({
          totalPayments: 0,
          totalValue: 0,
          totalPendingPayments: 0,
          totalPendingValue: 0,
          totalProcessedPayments: 0,
          totalProcessedValue: 0,
          totalSettledPayments: 0,
          totalSettledValue: 0,
          totalPaymentsOnHold: 0,
          totalValueOnHold: 0,
          paymentsByScheme: []
        })
      })
    })
  })
})
