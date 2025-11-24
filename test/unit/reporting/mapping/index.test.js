const { getDataFields } = require('../../../../app/reporting/mapping/index')
const REPORT_TYPES = require('../../../../app/constants/report-types')
const { AP_FIELDS, AR_FIELDS } = require('../../../../app/reporting/mapping/fields/ap-ar-fields')
const CLAIM_LEVEL_FIELDS = require('../../../../app/reporting/mapping/fields/claim-level-report-fields')
const REQUEST_EDITOR_REPORT_FIELDS = require('../../../../app/reporting/mapping/fields/request-editor-report-fields')
const PAYMENT_REQUEST_STATUSES_FIELDS = require('../../../../app/reporting/mapping/fields/payment-requests-report-fields')
const TRANSACTION_SUMMARY_FIELDS = require('../../../../app/reporting/mapping/fields/transaction-summary-fields')

describe('getDataFields', () => {
  test.each([
    [REPORT_TYPES.AR, AR_FIELDS],
    [REPORT_TYPES.AP, AP_FIELDS],
    [REPORT_TYPES.CLAIM_LEVEL, CLAIM_LEVEL_FIELDS],
    [REPORT_TYPES.PAYMENT_REQUEST_STATUSES, PAYMENT_REQUEST_STATUSES_FIELDS],
    [REPORT_TYPES.REQUEST_EDITOR, REQUEST_EDITOR_REPORT_FIELDS],
    [REPORT_TYPES.COMBINED_TRANSACTION, TRANSACTION_SUMMARY_FIELDS]
  ])('should return correct fields for %s', (reportType, expectedFields) => {
    expect(getDataFields(reportType)).toEqual(expectedFields)
  })

  test('should throw error for unsupported report type', () => {
    expect(() => getDataFields('NON_EXISTENT')).toThrowError(
      'Data mapper for Report Type: NON_EXISTENT does not match any mappers.'
    )
  })
})
