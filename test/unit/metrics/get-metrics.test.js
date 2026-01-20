jest.mock('../../../app/metrics/queries')

const { getPaymentMetrics, getStatementMetrics, getAllMetrics } = require('../../../app/metrics/get-metrics')
const queries = require('../../../app/metrics/queries')

describe('get-metrics', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('getStatementMetrics', () => {
    const mockStatementMetrics = {
      data: {
        totalStatements: 100,
        totalPrintPost: 50,
        totalPrintPostCost: 5000,
        totalEmail: 50,
        totalFailures: 0,
        statementsByScheme: []
      },
      error: false,
      message: ''
    }

    beforeEach(() => {
      queries.statements.getStatementMetrics = jest.fn().mockResolvedValue(mockStatementMetrics)
    })

    test('should fetch statement metrics with default period ytd', async () => {
      await getStatementMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: ytd')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('ytd', null, null)
    })

    test('should fetch statement metrics with custom period', async () => {
      await getStatementMetrics('year')

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: year')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('year', null, null)
    })

    test('should fetch statement metrics with period and schemeYear', async () => {
      await getStatementMetrics('year', 2023)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: year, year: 2023')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('year', 2023, null)
    })

    test('should fetch statement metrics with period, schemeYear, and month', async () => {
      await getStatementMetrics('monthInYear', 2023, 6)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: monthInYear, year: 2023, month: 6')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('monthInYear', 2023, 6)
    })

    test('should return statement metrics data', async () => {
      const result = await getStatementMetrics('ytd')

      expect(result).toEqual(mockStatementMetrics)
    })

    test('should include month in log when month is provided without schemeYear', async () => {
      await getStatementMetrics('ytd', null, 3)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: ytd, month: 3')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('ytd', null, 3)
    })

    test('should include schemeYear in log when schemeYear is zero', async () => {
      await getStatementMetrics('year', 0)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: year')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('year', 0, null)
    })

    test('should include month in log when month is zero', async () => {
      await getStatementMetrics('monthInYear', 2023, 0)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching statement metrics for period: monthInYear, year: 2023')
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('monthInYear', 2023, 0)
    })
  })

  describe('getPaymentMetrics', () => {
    const mockPaymentMetrics = {
      data: {
        totalPayments: 200,
        totalValue: 100000,
        totalPendingPayments: 50,
        totalPendingValue: 25000,
        totalProcessedPayments: 150,
        totalProcessedValue: 75000,
        totalSettledPayments: 100,
        totalSettledValue: 50000,
        totalPaymentsOnHold: 10,
        totalValueOnHold: 5000,
        paymentsByScheme: []
      },
      error: false,
      message: ''
    }

    beforeEach(() => {
      queries.payments.getPaymentMetrics = jest.fn().mockResolvedValue(mockPaymentMetrics)
    })

    test('should fetch payment metrics with default period ytd', async () => {
      await getPaymentMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: ytd')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('ytd', null, null)
    })

    test('should fetch payment metrics with custom period', async () => {
      await getPaymentMetrics('month')

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: month')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('month', null, null)
    })

    test('should fetch payment metrics with period and schemeYear', async () => {
      await getPaymentMetrics('year', 2024)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: year, year: 2024')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('year', 2024, null)
    })

    test('should fetch payment metrics with period, schemeYear, and month', async () => {
      await getPaymentMetrics('monthInYear', 2024, 12)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: monthInYear, year: 2024, month: 12')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('monthInYear', 2024, 12)
    })

    test('should return payment metrics data', async () => {
      const result = await getPaymentMetrics('ytd')

      expect(result).toEqual(mockPaymentMetrics)
    })

    test('should include month in log when month is provided without schemeYear', async () => {
      await getPaymentMetrics('ytd', null, 7)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: ytd, month: 7')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('ytd', null, 7)
    })

    test('should include schemeYear in log when schemeYear is zero', async () => {
      await getPaymentMetrics('year', 0)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: year')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('year', 0, null)
    })

    test('should include month in log when month is zero', async () => {
      await getPaymentMetrics('monthInYear', 2024, 0)

      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching payment metrics for period: monthInYear, year: 2024')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('monthInYear', 2024, 0)
    })
  })

  describe('getAllMetrics', () => {
    const mockPaymentMetrics = {
      data: {
        totalPayments: 200,
        totalValue: 100000,
        totalPendingPayments: 50,
        totalPendingValue: 25000,
        totalProcessedPayments: 150,
        totalProcessedValue: 75000,
        totalSettledPayments: 100,
        totalSettledValue: 50000,
        totalPaymentsOnHold: 10,
        totalValueOnHold: 5000,
        paymentsByScheme: []
      },
      error: false,
      message: ''
    }

    const mockStatementMetrics = {
      data: {
        totalStatements: 100,
        totalPrintPost: 50,
        totalPrintPostCost: 5000,
        totalEmail: 50,
        totalFailures: 0,
        statementsByScheme: []
      },
      error: false,
      message: ''
    }

    beforeEach(() => {
      queries.payments.getPaymentMetrics = jest.fn().mockResolvedValue(mockPaymentMetrics)
      queries.statements.getStatementMetrics = jest.fn().mockResolvedValue(mockStatementMetrics)
    })

    test('should fetch all metrics with default period ytd', async () => {
      await getAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('getAllMetrics called with period: ytd, schemeYear: null, month: null')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('ytd', null, null)
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('ytd', null, null)
    })

    test('should fetch all metrics with custom period', async () => {
      await getAllMetrics('year')

      expect(consoleLogSpy).toHaveBeenCalledWith('getAllMetrics called with period: year, schemeYear: null, month: null')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('year', null, null)
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('year', null, null)
    })

    test('should fetch all metrics with period and schemeYear', async () => {
      await getAllMetrics('year', 2023)

      expect(consoleLogSpy).toHaveBeenCalledWith('getAllMetrics called with period: year, schemeYear: 2023, month: null')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('year', 2023, null)
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('year', 2023, null)
    })

    test('should fetch all metrics with period, schemeYear, and month', async () => {
      await getAllMetrics('monthInYear', 2023, 6)

      expect(consoleLogSpy).toHaveBeenCalledWith('getAllMetrics called with period: monthInYear, schemeYear: 2023, month: 6')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('monthInYear', 2023, 6)
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('monthInYear', 2023, 6)
    })

    test('should return both payment and statement metrics when successful', async () => {
      const result = await getAllMetrics('ytd')

      expect(result).toEqual({
        paymentsMetrics: mockPaymentMetrics,
        statementsMetrics: mockStatementMetrics,
        criticalError: false,
        partialFailure: false,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })
    })

    test('should return default payment metrics with service error type when payment metrics fetch fails', async () => {
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue(new Error('Payment API error'))

      const result = await getAllMetrics('ytd')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Payment metrics failed:', expect.any(Error))
      expect(result.paymentsMetrics).toEqual({
        data: {
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
        },
        error: true,
        errorType: 'service',
        message: 'Unable to load payment metrics. Please try again later.',
        reason: 'Payment API error'
      })
      expect(result.statementsMetrics).toEqual(mockStatementMetrics)
      expect(result.criticalError).toBe(false)
      expect(result.partialFailure).toBe(true)
      expect(result.noData).toBe(false)
      expect(result.noPaymentData).toBe(false)
      expect(result.noStatementData).toBe(false)
    })

    test('should return default statement metrics with service error type when statement metrics fetch fails', async () => {
      queries.statements.getStatementMetrics = jest.fn().mockRejectedValue(new Error('Statement API error'))

      const result = await getAllMetrics('ytd')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Statement metrics failed:', expect.any(Error))
      expect(result.paymentsMetrics).toEqual(mockPaymentMetrics)
      expect(result.statementsMetrics).toEqual({
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: true,
        errorType: 'service',
        message: 'Unable to load statement metrics. Please try again later.',
        reason: 'Statement API error'
      })
      expect(result.criticalError).toBe(false)
      expect(result.partialFailure).toBe(true)
      expect(result.noData).toBe(false)
      expect(result.noPaymentData).toBe(false)
      expect(result.noStatementData).toBe(false)
    })

    test('should return default metrics for both when both fetches fail and log critical error', async () => {
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue(new Error('Payment API error'))
      queries.statements.getStatementMetrics = jest.fn().mockRejectedValue(new Error('Statement API error'))

      const result = await getAllMetrics('ytd')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Payment metrics failed:', expect.any(Error))
      expect(consoleErrorSpy).toHaveBeenCalledWith('Statement metrics failed:', expect.any(Error))
      expect(consoleErrorSpy).toHaveBeenCalledWith('Critical: Both metrics services returned errors.')
      expect(result.paymentsMetrics).toEqual({
        data: {
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
        },
        error: true,
        errorType: 'service',
        message: 'Unable to load payment metrics. Please try again later.',
        reason: 'Payment API error'
      })
      expect(result.statementsMetrics).toEqual({
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: true,
        errorType: 'service',
        message: 'Unable to load statement metrics. Please try again later.',
        reason: 'Statement API error'
      })
      expect(result.criticalError).toBe(true)
      expect(result.partialFailure).toBe(true)
      expect(result.noData).toBe(false)
      expect(result.noPaymentData).toBe(false)
      expect(result.noStatementData).toBe(false)
    })

    test('should detect connection error type for ECONNREFUSED in payment metrics', async () => {
      const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000')
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue(connectionError)

      const result = await getAllMetrics('ytd')

      expect(result.paymentsMetrics.errorType).toBe('connection')
      expect(result.paymentsMetrics.reason).toBe('connect ECONNREFUSED 127.0.0.1:3000')
    })

    test('should detect connection error type for timeout in statement metrics', async () => {
      const timeoutError = new Error('Request timeout exceeded')
      queries.statements.getStatementMetrics = jest.fn().mockRejectedValue(timeoutError)

      const result = await getAllMetrics('ytd')

      expect(result.statementsMetrics.errorType).toBe('connection')
      expect(result.statementsMetrics.reason).toBe('Request timeout exceeded')
    })

    test('should log critical connection issue when both services fail with connection errors', async () => {
      const connectionError1 = new Error('connect ECONNREFUSED 127.0.0.1:3000')
      const connectionError2 = new Error('Request timeout exceeded')
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue(connectionError1)
      queries.statements.getStatementMetrics = jest.fn().mockRejectedValue(connectionError2)

      await getAllMetrics('ytd')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Critical: Both metrics services are unreachable. Possible network or infrastructure issue.')
    })

    test('should log critical service error when both services fail with service errors', async () => {
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue(new Error('500 Internal Server Error'))
      queries.statements.getStatementMetrics = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'))

      await getAllMetrics('ytd')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Critical: Both metrics services returned errors.')
    })

    test('should log critical connection issue when one service has connection error and other fails', async () => {
      const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000')
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue(connectionError)
      queries.statements.getStatementMetrics = jest.fn().mockRejectedValue(new Error('500 Internal Server Error'))

      await getAllMetrics('ytd')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Critical: Both metrics services are unreachable. Possible network or infrastructure issue.')
    })

    test('should handle payment metrics with error flag set but not rejected', async () => {
      const errorPaymentMetrics = {
        data: {
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
        },
        error: true,
        message: 'API error'
      }
      queries.payments.getPaymentMetrics = jest.fn().mockResolvedValue(errorPaymentMetrics)

      const result = await getAllMetrics('ytd')

      expect(result.paymentsMetrics).toEqual(errorPaymentMetrics)
      expect(result.statementsMetrics).toEqual(mockStatementMetrics)
      expect(result.criticalError).toBe(false)
      expect(result.partialFailure).toBe(true)
    })

    test('should handle statement metrics with error flag set but not rejected', async () => {
      const errorStatementMetrics = {
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: true,
        message: 'API error'
      }
      queries.statements.getStatementMetrics = jest.fn().mockResolvedValue(errorStatementMetrics)

      const result = await getAllMetrics('ytd')

      expect(result.paymentsMetrics).toEqual(mockPaymentMetrics)
      expect(result.statementsMetrics).toEqual(errorStatementMetrics)
      expect(result.criticalError).toBe(false)
      expect(result.partialFailure).toBe(true)
    })

    test('should set criticalError when both metrics have error flag', async () => {
      const errorPaymentMetrics = {
        data: {
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
        },
        error: true,
        message: 'Payment API error'
      }
      const errorStatementMetrics = {
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: true,
        message: 'Statement API error'
      }
      queries.payments.getPaymentMetrics = jest.fn().mockResolvedValue(errorPaymentMetrics)
      queries.statements.getStatementMetrics = jest.fn().mockResolvedValue(errorStatementMetrics)

      const result = await getAllMetrics('ytd')

      expect(result.criticalError).toBe(true)
      expect(result.partialFailure).toBe(true)
    })

    test('should detect no data when both services return empty data', async () => {
      const emptyPaymentMetrics = {
        data: {
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
        },
        error: false
      }
      const emptyStatementMetrics = {
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: false
      }
      queries.payments.getPaymentMetrics = jest.fn().mockResolvedValue(emptyPaymentMetrics)
      queries.statements.getStatementMetrics = jest.fn().mockResolvedValue(emptyStatementMetrics)

      const result = await getAllMetrics('ytd')

      expect(consoleLogSpy).toHaveBeenCalledWith('Info: No metrics data available from either service for the selected period.')
      expect(result.noData).toBe(true)
      expect(result.noPaymentData).toBe(true)
      expect(result.noStatementData).toBe(true)
      expect(result.criticalError).toBe(false)
      expect(result.partialFailure).toBe(false)
    })

    test('should detect no payment data when only payment data is empty', async () => {
      const emptyPaymentMetrics = {
        data: {
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
        },
        error: false
      }
      queries.payments.getPaymentMetrics = jest.fn().mockResolvedValue(emptyPaymentMetrics)

      const result = await getAllMetrics('ytd')

      expect(consoleLogSpy).toHaveBeenCalledWith('Info: No payment metrics data available for the selected period.')
      expect(result.noData).toBe(false)
      expect(result.noPaymentData).toBe(true)
      expect(result.noStatementData).toBe(false)
    })

    test('should detect no statement data when only statement data is empty', async () => {
      const emptyStatementMetrics = {
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: false
      }
      queries.statements.getStatementMetrics = jest.fn().mockResolvedValue(emptyStatementMetrics)

      const result = await getAllMetrics('ytd')

      expect(consoleLogSpy).toHaveBeenCalledWith('Info: No statement metrics data available for the selected period.')
      expect(result.noData).toBe(false)
      expect(result.noPaymentData).toBe(false)
      expect(result.noStatementData).toBe(true)
    })

    test('should handle zero values for schemeYear and month', async () => {
      await getAllMetrics('monthInYear', 0, 0)

      expect(consoleLogSpy).toHaveBeenCalledWith('getAllMetrics called with period: monthInYear, schemeYear: 0, month: 0')
      expect(queries.payments.getPaymentMetrics).toHaveBeenCalledWith('monthInYear', 0, 0)
      expect(queries.statements.getStatementMetrics).toHaveBeenCalledWith('monthInYear', 0, 0)
    })

    test('should execute payment and statement queries in parallel', async () => {
      const paymentDelay = 100
      const statementDelay = 50
      let paymentStartTime
      let statementStartTime

      queries.payments.getPaymentMetrics = jest.fn().mockImplementation(async () => {
        paymentStartTime = Date.now()
        await new Promise(resolve => setTimeout(resolve, paymentDelay))
        return mockPaymentMetrics
      })

      queries.statements.getStatementMetrics = jest.fn().mockImplementation(async () => {
        statementStartTime = Date.now()
        await new Promise(resolve => setTimeout(resolve, statementDelay))
        return mockStatementMetrics
      })

      const startTime = Date.now()
      await getAllMetrics('ytd')
      const totalTime = Date.now() - startTime

      expect(totalTime).toBeLessThan(paymentDelay + statementDelay)
      expect(Math.abs(paymentStartTime - statementStartTime)).toBeLessThan(50)
    })

    test('should handle error without message property', async () => {
      queries.payments.getPaymentMetrics = jest.fn().mockRejectedValue({})

      const result = await getAllMetrics('ytd')

      expect(result.paymentsMetrics.reason).toBe('Unknown error')
      expect(result.paymentsMetrics.errorType).toBe('service')
    })
  })
})
