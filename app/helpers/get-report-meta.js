const REPORT_TYPES = require('../constants/report-types')
const REPORT_PATHS = require('../constants/report-list')
const DOWNLOAD_REPORT_LIST = require('../constants/download-report-list')
const GENERATE_REPORT_LIST = require('../constants/generate-report-list')

const reportMeta = {
  [REPORT_TYPES.PAYMENT_REQUEST_STATUSES]: {
    title: 'Generate payment request statuses',
    url: GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2
  },
  [REPORT_TYPES.COMBINED_TRANSACTION]: {
    title: 'Combined transaction report',
    url: REPORT_PATHS.TRANSACTION_SUMMARY
  },
  [REPORT_TYPES.SUPPRESSED_PAYMENT_REQUESTS]: {
    title: 'Suppressed payment requests',
    url: DOWNLOAD_REPORT_LIST.SUPPRESSED_PAYMENTS
  },
  [REPORT_TYPES.HOLDS]: {
    title: 'Holds',
    url: DOWNLOAD_REPORT_LIST.HOLDS
  },
  [REPORT_TYPES.REQUEST_EDITOR]: {
    title: 'Request Editor report',
    url: DOWNLOAD_REPORT_LIST.REQUEST_EDITOR_REPORT
  },
  [REPORT_TYPES.CLAIM_LEVEL]: {
    title: 'Claim level report',
    url: REPORT_PATHS.CLAIM_LEVEL_REPORT
  },
  [REPORT_TYPES.AP]: {
    title: 'AP listing report',
    url: GENERATE_REPORT_LIST.AP_AR
  },
  [REPORT_TYPES.AR]: {
    title: 'AR listing report',
    url: GENERATE_REPORT_LIST.AP_AR
  }
}

const getReportMeta = (reportType) => reportMeta[reportType] ?? null

module.exports = { getReportMeta }
