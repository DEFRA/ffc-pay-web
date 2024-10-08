const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const api = require('../api')
const convertToCSV = require('../helpers/convert-to-csv')
const apListingSchema = require('./schemas/ap-listing-schema')
const config = require('../config/storage')

function generateRoutes (reportName, reportDataUrl, reportDataKey) {
  return [
    {
      method: 'GET',
      path: `/report-list/${reportName}`,
      options: {
        auth: { scope: [holdAdmin, schemeAdmin, dataView] },
        handler: async (request, h) => {
          return h.view(`reports-list/${reportName}`)
        }
      }
    },
    {
      method: 'GET',
      path: `/report-list/${reportName}/download`,
      options: {
        auth: { scope: [holdAdmin, schemeAdmin, dataView] },
        validate: {
          query: apListingSchema,
          failAction: async (request, h, err) => {
            request.log(['error', 'validation'], err)
            const errors = err.details
              ? err.details.map(detail => {
                  return {
                    text: detail.message,
                    href: '#' + detail.path[0]
                  }
                })
              : []
            const data = { errors }
            if (reportName === 'ar-listing' || reportName === 'ap-ar-listing') {
              return h.view('reports-list/ap-ar-listing', data).code(400).takeover()
            }
            if (reportName === 'request-editor-report') {
              return h.view('reports-list/request-editor-report', data).code(400).takeover()
            }
            if (reportName === 'claim-level-report') {
              return h.view('reports-list/claim-level-report', data).code(400).takeover()
            } else {
              return h.view('404', data).code(404).takeover()
            }
          }
        },
        handler: async (request, h) => {
          const { 'start-date-day': startDay, 'start-date-month': startMonth, 'start-date-year': startYear, 'end-date-day': endDay, 'end-date-month': endMonth, 'end-date-year': endYear } = request.query

          let url = reportDataUrl
          let startDate, endDate

          if (startDay && startMonth && startYear) {
            startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`
          } else {
            startDate = '2015-01-01'
          }

          if (endDay && endMonth && endYear) {
            endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
          } else if (startDate) {
            const now = new Date()
            endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
          }

          if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`
          }

          try {
            const response = await api.getTrackingData(url)
            const trackingData = response.payload
            const selectedData = trackingData[reportDataKey].map(data => {
              let mappedData
              if (reportName === 'request-editor-report') {
                mappedData = {
                  FRN: data.frn,
                  deltaAmount: data.deltaAmount,
                  SourceSystem: data.sourceSystem,
                  agreementNumber: data.agreementNumber,
                  invoiceNumber: data.invoiceNumber,
                  PaymentRequestNumber: data.paymentRequestNumber,
                  year: data.year,
                  receivedInRequestEditor: data.receivedInRequestEditor,
                  enriched: data.enriched,
                  debtType: data.debtType,
                  ledgerSplit: data.ledgerSplit,
                  releasedFromRequestEditor: data.releasedFromRequestEditor
                }
              } else if (reportName === 'claim-level-report') {
                mappedData = {
                  FRN: data.frn,
                  claimID: data.claimNumber,
                  revenueOrCapital: data.revenueOrCapital,
                  agreementNumber: data.agreementNumber,
                  year: data.year,
                  paymentCurrency: data.currency,
                  latestFullClaimAmount: data.value,
                  latestSitiPR: data.paymentRequestNumber,
                  latestInDAXAmount: data.daxValue,
                  latestInDAXPR: data.daxPaymentRequestNumber,
                  overallStatus: data.overallStatus,
                  crossBorderFlag: data.crossBorderFlag,
                  latestTransactionStatus: data.status,
                  valueStillToProcess: data.valueStillToProcess,
                  PRsStillToProcess: data.prStillToProcess
                }
              } else {
                mappedData = {
                  Filename: data.daxFileName,
                  'Date Time': data.lastUpdated,
                  Event: data.status,
                  FRN: data.frn,
                  'Original Invoice Number': data.originalInvoiceNumber,
                  'Original Invoice Value': data.value,
                  'Invoice Number': data.invoiceNumber,
                  'Invoice Delta Amount': data.deltaAmount,
                  'D365 Invoice Imported': data.routedToRequestEditor,
                  'D365 Invoice Payment': data.settledValue,
                  'PH Error Status': data.phError,
                  'D365 Error Status': data.daxError
                }
                if (reportName === 'ar-listing') {
                  delete mappedData['D365 Invoice Payment']
                }
              }
              return mappedData
            })

            if (selectedData.length === 0) {
              return h.view(`reports-list/${reportName}`, {
                errors: [{
                  text: 'No data available for the selected date range'
                }]
              })
            }

            const csv = convertToCSV(selectedData)

            let baseFilename
            switch (reportName) {
              case 'ar-listing':
                baseFilename = config.arListingReportName.slice(0, -4)
                break
              case 'request-editor-report':
                baseFilename = config.requestEditorReportName.slice(0, -4)
                break
              case 'claim-level-report':
                baseFilename = config.claimLevelReportName.slice(0, -4)
                break
              default:
                baseFilename = config.apListingReportName.slice(0, -4)
            }
            const filename = `${baseFilename}-from-${startDate}-to-${endDate}.csv`
            return h.response(csv)
              .header('Content-Type', 'text/csv')
              .header('Content-Disposition', `attachment; filename=${filename}`)
          } catch (error) {
            console.error('Failed to fetch tracking data:', error)
            return h.view(`reports-list/${reportName}`, { errorMessage: 'Failed to fetch tracking data' })
          }
        }
      }
    }
  ]
}

module.exports = generateRoutes
