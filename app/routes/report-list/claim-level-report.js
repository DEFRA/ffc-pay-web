const REPORT_LIST = require('../../constants/report-list')
const REPORT_TYPES = require('../../constants/report-types')
const REPORTS_VIEWS = require('../../constants/report-views')

const {
  addDetailsToFilename,
  createFormRoute,
  createDownloadRoute,
  generateReportHandler
} = require('../../helpers')

const claimLevelSchema = require('../schemas/claim-level-schema')

const storageConfig = require('../../config').storageConfig

module.exports = [
  createFormRoute(
    REPORT_LIST.CLAIM_LEVEL_REPORT,
    REPORTS_VIEWS.CLAIM_LEVEL_REPORT
  ),
  createDownloadRoute(
    REPORT_LIST.CLAIM_LEVEL_REPORT_DOWNLOAD,
    REPORTS_VIEWS.CLAIM_LEVEL_REPORT,
    claimLevelSchema,
    generateReportHandler(
      REPORT_TYPES.CLAIM_LEVEL,
      (payload) =>
        addDetailsToFilename(
          storageConfig.claimLevelReportName,
          payload
        )
    )
  )
]
