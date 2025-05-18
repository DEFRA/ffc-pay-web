const REPORT_TYPES = require('../../constants/report-types')

const { AP_FIELDS, AR_FIELDS } = require('./fields/ap-ar-fields')
const CLAIM_LEVEL_FIELDS = require('./fields/claim-level-report-fields')
const REQUEST_EDITOR_REPORT_FIELDS = require('./fields/request-editor-report-fields')
const PAYMENT_REQUEST_STATUSES_FIELDS = require('./fields/payment-requests-report-fields')
const TRANSACTION_SUMMARY_FIELDS = require('./fields/transaction-summary-fields')

const getDataFields = reportType => {
  switch (reportType) {
    case REPORT_TYPES.AR:
      return AR_FIELDS
    case REPORT_TYPES.AP:
      return AP_FIELDS
    case REPORT_TYPES.CLAIM_LEVEL:
      return CLAIM_LEVEL_FIELDS
    case REPORT_TYPES.PAYMENT_REQUEST_STATUSES:
      return PAYMENT_REQUEST_STATUSES_FIELDS
    case REPORT_TYPES.REQUEST_EDITOR:
      return REQUEST_EDITOR_REPORT_FIELDS
    case REPORT_TYPES.COMBINED_TRANSACTION:
      return TRANSACTION_SUMMARY_FIELDS
    default:
      throw new Error(`Data mapper for Report Type: ${reportType} does not match any mappers.`)
  }
}

module.exports = { getDataFields }
