const { getDataFields } = require('../../../../app/reporting/mapping/index')
const REPORT_TYPES = require('../../../../app/constants/report-types')
const { AP_FIELDS, AR_FIELDS } = require('../../../../app/reporting/mapping/fields/ap-ar-fields')
const CLAIM_LEVEL_FIELDS = require('../../../../app/reporting/mapping/fields/claim-level-report-fields')
const REQUEST_EDITOR_REPORT_FIELDS = require('../../../../app/reporting/mapping/fields/request-editor-report-fields')
const PAYMENT_REQUEST_STATUSES_FIELDS = require('../../../../app/reporting/mapping/fields/payment-requests-report-fields')
const TRANSACTION_SUMMARY_FIELDS = require('../../../../app/reporting/mapping/fields/transaction-summary-fields')

describe('getDataFields', () => {
  test('should return AR_FIELDS for REPORT_TYPES.AR', () => {
    const result = getDataFields(REPORT_TYPES.AR)
    expect(result).toEqual(AR_FIELDS)
  })

  test('should return AP_FIELDS for REPORT_TYPES.AP', () => {
    const result = getDataFields(REPORT_TYPES.AP)
    expect(result).toEqual(AP_FIELDS)
  })

  test('should return CLAIM_LEVEL_FIELDS for REPORT_TYPES.CLAIM_LEVEL', () => {
    const result = getDataFields(REPORT_TYPES.CLAIM_LEVEL)
    expect(result).toEqual(CLAIM_LEVEL_FIELDS)
  })

  test('should return PAYMENT_REQUEST_STATUSES_FIELDS for REPORT_TYPES.PAYMENT_REQUEST_STATUSES', () => {
    const result = getDataFields(REPORT_TYPES.PAYMENT_REQUEST_STATUSES)
    expect(result).toEqual(PAYMENT_REQUEST_STATUSES_FIELDS)
  })

  test('should return REQUEST_EDITOR_REPORT_FIELDS for REPORT_TYPES.REQUEST_EDITOR', () => {
    const result = getDataFields(REPORT_TYPES.REQUEST_EDITOR)
    expect(result).toEqual(REQUEST_EDITOR_REPORT_FIELDS)
  })

  test('should return TRANSACTION_SUMMARY_FIELDS for REPORT_TYPES.COMBINED_TRANSACTION', () => {
    const result = getDataFields(REPORT_TYPES.COMBINED_TRANSACTION)
    expect(result).toEqual(TRANSACTION_SUMMARY_FIELDS)
  })

  test('should throw error for unsupported report type', () => {
    expect(() => getDataFields('NON_EXISTENT')).toThrowError(
      'Data mapper for Report Type: NON_EXISTENT does not match any mappers.'
    )
  })
})
