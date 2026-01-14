jest.mock('../../../app/metrics/get-metrics')
jest.mock('../../../app/helpers/generate-scheme-years')
jest.mock('../../../app/auth/permissions', () => ({
  applicationAdmin: 'applicationAdmin',
  dataView: 'dataView'
}))

const metricsRoutes = require('../../../app/routes/metrics')
const { getAllMetrics } = require('../../../app/metrics/get-metrics')
const { generateSchemeYears } = require('../../../app/helpers/generate-scheme-years')
const METRICS_ROUTES = require('../../../app/constants/metrics-routes')
const METRICS_VIEWS = require('../../../app/constants/metrics-views')
const MONTHS = require('../../../app/constants/months')

describe('metrics routes', () => {
  let consoleLogSpy
  let consoleErrorSpy
  let mockRequest
  let mockH
  let handler

  const mockPaymentsMetrics = {
    data: {
      totalPayments: 200,
      totalValue: 100000,
      paymentsByScheme: [
        { schemeName: 'SFI', totalPayments: 100, totalValue: 50000 }
      ]
    },
    error: false,
    errorType: null,
    message: ''
  }

  const mockStatementsMetrics = {
    data: {
      totalStatements: 150,
      totalPrintPost: 80,
      totalPrintPostCost: 12000,
      totalEmail: 70,
      statementsByScheme: [
        { schemeName: 'SFI', totalStatements: 75, printPostCount: 40 }
      ]
    },
    error: false,
    errorType: null,
    message: ''
  }

  const mockSchemeYears = [2024, 2023, 2022]

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockH = {
      view: jest.fn().mockReturnValue('view-result')
    }

    generateSchemeYears.mockReturnValue(mockSchemeYears)
    getAllMetrics.mockResolvedValue({
      paymentsMetrics: mockPaymentsMetrics,
      statementsMetrics: mockStatementsMetrics,
      criticalError: false,
      partialFailure: false,
      noData: false,
      noPaymentData: false,
      noStatementData: false
    })

    const metricsRoute = metricsRoutes.find(
      route => route.method === 'GET' && route.path === METRICS_ROUTES.BASE
    )
    handler = metricsRoute.options.handler
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('GET /metrics route configuration', () => {
    test('should have correct method and path', () => {
      const route = metricsRoutes[0]
      expect(route.method).toBe('GET')
      expect(route.path).toBe(METRICS_ROUTES.BASE)
    })

    test('should have correct auth scope', () => {
      const route = metricsRoutes[0]
      expect(route.options.auth.scope).toEqual(['applicationAdmin', 'dataView'])
    })
  })

  describe('successful requests', () => {
    test('should fetch metrics with default period all', async () => {
      mockRequest = { query: {} }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: all')
      expect(getAllMetrics).toHaveBeenCalledWith('all', null, null)
    })

    test('should fetch metrics with custom period', async () => {
      mockRequest = { query: { period: 'ytd' } }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: ytd')
      expect(getAllMetrics).toHaveBeenCalledWith('ytd', null, null)
    })

    test('should fetch metrics with period and schemeYear', async () => {
      mockRequest = { query: { period: 'year', schemeYear: '2024' } }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: year, year: 2024')
      expect(getAllMetrics).toHaveBeenCalledWith('year', 2024, null)
    })

    test('should fetch metrics with period, schemeYear, and month', async () => {
      mockRequest = { query: { period: 'monthInYear', schemeYear: '2024', month: '6' } }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: monthInYear, year: 2024, month: 6')
      expect(getAllMetrics).toHaveBeenCalledWith('monthInYear', 2024, 6)
    })

    test('should log only period when no year or month provided', async () => {
      mockRequest = { query: { period: 'month' } }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: month')
      expect(getAllMetrics).toHaveBeenCalledWith('month', null, null)
    })

    test('should log period and year when only year provided', async () => {
      mockRequest = { query: { period: 'year', schemeYear: '2023' } }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: year, year: 2023')
      expect(getAllMetrics).toHaveBeenCalledWith('year', 2023, null)
    })

    test('should log period and month when only month provided', async () => {
      mockRequest = { query: { period: 'monthInYear', month: '6' } }

      await handler(mockRequest, mockH)

      expect(consoleLogSpy).toHaveBeenCalledWith('Loading metrics for period: monthInYear, month: 6')
      expect(getAllMetrics).toHaveBeenCalledWith('monthInYear', null, 6)
    })

    test('should render view with metrics data', async () => {
      mockRequest = { query: { period: 'ytd' } }

      const result = await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(METRICS_VIEWS.BASE, {
        paymentsMetrics: mockPaymentsMetrics.data,
        statementsMetrics: mockStatementsMetrics.data,
        selectedPeriod: 'ytd',
        schemeYear: null,
        selectedMonth: null,
        availableYears: mockSchemeYears,
        availableMonths: MONTHS,
        error: null
      })
      expect(result).toBe('view-result')
    })

    test('should render view with all query parameters', async () => {
      mockRequest = { query: { period: 'monthInYear', schemeYear: '2024', month: '12' } }

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(METRICS_VIEWS.BASE, {
        paymentsMetrics: mockPaymentsMetrics.data,
        statementsMetrics: mockStatementsMetrics.data,
        selectedPeriod: 'monthInYear',
        schemeYear: 2024,
        selectedMonth: 12,
        availableYears: mockSchemeYears,
        availableMonths: MONTHS,
        error: null
      })
    })

    test('should parse schemeYear as integer', async () => {
      mockRequest = { query: { period: 'year', schemeYear: '2024' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('year', 2024, null)
    })

    test('should parse month as integer', async () => {
      mockRequest = { query: { period: 'monthInYear', schemeYear: '2024', month: '6' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('monthInYear', 2024, 6)
    })

    test('should handle schemeYear zero', async () => {
      mockRequest = { query: { period: 'year', schemeYear: '0' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('year', 0, null)
    })

    test('should handle month zero', async () => {
      mockRequest = { query: { period: 'monthInYear', schemeYear: '2024', month: '0' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('monthInYear', 2024, 0)
    })

    test('should call generateSchemeYears', async () => {
      mockRequest = { query: {} }

      await handler(mockRequest, mockH)

      expect(generateSchemeYears).toHaveBeenCalled()
    })

    test('should include MONTHS constant in view', async () => {
      mockRequest = { query: {} }

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ availableMonths: MONTHS })
      )
    })
  })

  describe('error handling from metrics services', () => {
    test('should set error message when payment metrics fails', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: mockPaymentsMetrics.data,
          error: true,
          errorType: 'service',
          message: 'Payment service error'
        },
        statementsMetrics: mockStatementsMetrics,
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load payment metrics. Please try again later. If this error persists, contact a member of the Payments and Documents team.'
        })
      )
    })

    test('should set error message when statement metrics fails', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: mockPaymentsMetrics,
        statementsMetrics: {
          data: mockStatementsMetrics.data,
          error: true,
          errorType: 'service',
          message: 'Statement service error'
        },
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load statement metrics. Please try again later. If this error persists, contact a member of the Payments and Documents team.'
        })
      )
    })

    test('should set critical error message when both metrics fail', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: mockPaymentsMetrics.data,
          error: true,
          errorType: 'service',
          message: 'Payment service error'
        },
        statementsMetrics: {
          data: mockStatementsMetrics.data,
          error: true,
          errorType: 'service',
          message: 'Statement service error'
        },
        criticalError: true,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics from both payment and statement services. Please try again later or contact the Payments and Documents team.'
        })
      )
    })

    test('should include connection issue message when payment metrics has connection error', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: mockPaymentsMetrics.data,
          error: true,
          errorType: 'connection',
          message: 'Payment service connection error'
        },
        statementsMetrics: mockStatementsMetrics,
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load payment metrics. Connection issue detected. Please try again later. If this error persists, contact a member of the Payments and Documents team.'
        })
      )
    })

    test('should include connection issue message when statement metrics has connection error', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: mockPaymentsMetrics,
        statementsMetrics: {
          data: mockStatementsMetrics.data,
          error: true,
          errorType: 'connection',
          message: 'Statement service connection error'
        },
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load statement metrics. Connection issue detected. Please try again later. If this error persists, contact a member of the Payments and Documents team.'
        })
      )
    })

    test('should include connection issue message when both metrics have connection errors', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: mockPaymentsMetrics.data,
          error: true,
          errorType: 'connection',
          message: 'Payment service connection error'
        },
        statementsMetrics: {
          data: mockStatementsMetrics.data,
          error: true,
          errorType: 'connection',
          message: 'Statement service connection error'
        },
        criticalError: true,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics from both payment and statement services. Please try again later or contact the Payments and Documents team.'
        })
      )
    })

    test('should still render view with partial data when payment metrics fails', async () => {
      mockRequest = { query: { period: 'ytd' } }
      const errorPaymentsMetrics = {
        data: {
          totalPayments: 0,
          totalValue: 0,
          paymentsByScheme: []
        },
        error: true,
        errorType: 'service',
        message: 'Payment service error'
      }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: errorPaymentsMetrics,
        statementsMetrics: mockStatementsMetrics,
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          paymentsMetrics: errorPaymentsMetrics.data,
          statementsMetrics: mockStatementsMetrics.data
        })
      )
    })

    test('should still render view with partial data when statement metrics fails', async () => {
      mockRequest = { query: { period: 'ytd' } }
      const errorStatementsMetrics = {
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          statementsByScheme: []
        },
        error: true,
        errorType: 'service',
        message: 'Statement service error'
      }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: mockPaymentsMetrics,
        statementsMetrics: errorStatementsMetrics,
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          paymentsMetrics: mockPaymentsMetrics.data,
          statementsMetrics: errorStatementsMetrics.data
        })
      )
    })

    test('should handle both metrics failing with mixed error types', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: mockPaymentsMetrics.data,
          error: true,
          errorType: 'connection',
          message: 'Payment connection error'
        },
        statementsMetrics: {
          data: mockStatementsMetrics.data,
          error: true,
          errorType: 'service',
          message: 'Statement service error'
        },
        criticalError: true,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics from both payment and statement services. Please try again later or contact the Payments and Documents team.'
        })
      )
    })
  })

  describe('no data warnings', () => {
    test('should show warning when both services have no data', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: {
            totalPayments: 0,
            totalValue: 0,
            paymentsByScheme: []
          },
          error: false
        },
        statementsMetrics: {
          data: {
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            statementsByScheme: []
          },
          error: false
        },
        criticalError: false,
        partialFailure: false,
        noData: true,
        noPaymentData: true,
        noStatementData: true
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'No metrics data is available for the selected period from either payment or statement services. This may indicate no activity has been recorded yet.'
        })
      )
    })

    test('should show warning when payment data is empty', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: {
            totalPayments: 0,
            totalValue: 0,
            paymentsByScheme: []
          },
          error: false
        },
        statementsMetrics: mockStatementsMetrics,
        criticalError: false,
        partialFailure: false,
        noData: false,
        noPaymentData: true,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'No payment metrics data is available for the selected period.'
        })
      )
    })

    test('should show warning when statement data is empty', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: mockPaymentsMetrics,
        statementsMetrics: {
          data: {
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            statementsByScheme: []
          },
          error: false
        },
        criticalError: false,
        partialFailure: false,
        noData: false,
        noPaymentData: false,
        noStatementData: true
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'No statement metrics data is available for the selected period.'
        })
      )
    })

    test('should show combined warning when both payment and statement data empty but not same as noData', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: {
            totalPayments: 0,
            totalValue: 0,
            paymentsByScheme: []
          },
          error: false
        },
        statementsMetrics: {
          data: {
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            statementsByScheme: []
          },
          error: false
        },
        criticalError: false,
        partialFailure: false,
        noData: false,
        noPaymentData: true,
        noStatementData: true
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'No payment or statement metrics data is available for the selected period.'
        })
      )
    })

    test('should prioritize critical error over no data warning', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: {
            totalPayments: 0,
            totalValue: 0,
            paymentsByScheme: []
          },
          error: true,
          errorType: 'service'
        },
        statementsMetrics: {
          data: {
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            statementsByScheme: []
          },
          error: true,
          errorType: 'service'
        },
        criticalError: true,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: false
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics from both payment and statement services. Please try again later or contact the Payments and Documents team.'
        })
      )
    })

    test('should prioritize partial failure over no data warning', async () => {
      mockRequest = { query: { period: 'ytd' } }
      getAllMetrics.mockResolvedValue({
        paymentsMetrics: {
          data: {
            totalPayments: 0,
            totalValue: 0,
            paymentsByScheme: []
          },
          error: true,
          errorType: 'service'
        },
        statementsMetrics: {
          data: {
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            statementsByScheme: []
          },
          error: false
        },
        criticalError: false,
        partialFailure: true,
        noData: false,
        noPaymentData: false,
        noStatementData: true
      })

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load payment metrics. Please try again later. If this error persists, contact a member of the Payments and Documents team.'
        })
      )
    })
  })

  describe('exception handling', () => {
    test('should log error and render fallback view when getAllMetrics throws', async () => {
      mockRequest = { query: { period: 'ytd' } }
      const error = new Error('Unexpected error')
      getAllMetrics.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading metrics:', error)
      expect(mockH.view).toHaveBeenCalledWith(METRICS_VIEWS.BASE, {
        paymentsMetrics: {
          totalPayments: 0,
          totalValue: 0,
          paymentsByScheme: []
        },
        statementsMetrics: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          statementsByScheme: []
        },
        selectedPeriod: 'all',
        schemeYear: null,
        selectedMonth: null,
        availableYears: mockSchemeYears,
        availableMonths: MONTHS,
        error: 'Unable to load metrics. Please try again later.'
      })
    })

    test('should handle network errors', async () => {
      mockRequest = { query: { period: 'year', schemeYear: '2024' } }
      const error = new Error('Network timeout')
      getAllMetrics.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading metrics:', error)
      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics. Please try again later.'
        })
      )
    })

    test('should handle errors when generateSchemeYears throws in success path', async () => {
      mockRequest = { query: { period: 'ytd' } }
      generateSchemeYears.mockImplementationOnce(() => {
        throw new Error('Year generation failed')
      })

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading metrics:', expect.any(Error))
      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics. Please try again later.'
        })
      )
    })

    test('should return view result even on error', async () => {
      mockRequest = { query: {} }
      getAllMetrics.mockRejectedValue(new Error('Service down'))

      const result = await handler(mockRequest, mockH)

      expect(result).toBe('view-result')
    })

    test('should handle errors when query is undefined', async () => {
      mockRequest = { query: undefined }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading metrics:', expect.any(TypeError))
      expect(mockH.view).toHaveBeenCalledWith(
        METRICS_VIEWS.BASE,
        expect.objectContaining({
          error: 'Unable to load metrics. Please try again later.'
        })
      )
    })
  })

  describe('query parameter handling', () => {
    test('should handle invalid schemeYear string', async () => {
      mockRequest = { query: { period: 'year', schemeYear: 'invalid' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('year', expect.any(Number), null)
    })

    test('should handle invalid month string', async () => {
      mockRequest = { query: { period: 'monthInYear', schemeYear: '2024', month: 'invalid' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('monthInYear', 2024, expect.any(Number))
    })

    test('should handle empty string period', async () => {
      mockRequest = { query: { period: '' } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('all', null, null)
    })

    test('should handle null schemeYear in query', async () => {
      mockRequest = { query: { period: 'year', schemeYear: null } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('year', null, null)
    })

    test('should handle undefined month in query', async () => {
      mockRequest = { query: { period: 'monthInYear', schemeYear: '2024', month: undefined } }

      await handler(mockRequest, mockH)

      expect(getAllMetrics).toHaveBeenCalledWith('monthInYear', 2024, null)
    })
  })
})
