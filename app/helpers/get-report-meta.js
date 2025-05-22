const REPORT_TYPES = require('../constants/report-types')
const REPORT_PATHS = require('../constants/report-list')

const reportMeta = {
  [REPORT_TYPES.PAYMENT_REQUEST_STATUSES]: {
    title: 'Payment request statuses',
    url: REPORT_PATHS.PAYMENT_REQUESTS
  },
  [REPORT_TYPES.COMBINED_TRANSACTION]: {
    title: 'Combined transaction report',
    url: REPORT_PATHS.TRANSACTION_SUMMARY
  },
  [REPORT_TYPES.SUPPRESSED_PAYMENT_REQUESTS]: {
    title: 'Suppressed payment requests',
    url: REPORT_PATHS.SUPPRESSED_PAYMENTS
  },
  [REPORT_TYPES.HOLDS]: {
    title: 'Holds',
    url: REPORT_PATHS.HOLDS
  },
  [REPORT_TYPES.REQUEST_EDITOR]: {
    title: 'Request Editor report',
    url: REPORT_PATHS.REQUEST_EDITOR_REPORT
  },
  [REPORT_TYPES.CLAIM_LEVEL]: {
    title: 'Claim level report',
    url: REPORT_PATHS.CLAIM_LEVEL_REPORT
  },
  [REPORT_TYPES.AP]: {
    title: 'AP listing report',
    url: REPORT_PATHS.AP_AR
  },
  [REPORT_TYPES.AR]: {
    title: 'AR listing report',
    url: REPORT_PATHS.AP_AR
  }
}

const getReportMeta = (reportType) => reportMeta[reportType] ?? null

module.exports = { getReportMeta }
