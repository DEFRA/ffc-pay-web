const REPORT_LIST = require('../../constants/report-list')
const REPORT_TYPES = require('../../constants/report-types')
const REPORTS_VIEWS = require('../../constants/report-views')

const { getReportMeta } = require('../../helpers/get-report-meta')

const {
  createDownloadRoute,
  generateReportHandler
} = require('../../helpers')

const storageConfig = require('../../config').storageConfig

module.exports = [
  createDownloadRoute(
    REPORT_LIST.REQUEST_EDITOR_REPORT,
    REPORTS_VIEWS.REPORT_VALIDATION_ERROR,
    undefined,
    generateReportHandler(
      REPORT_TYPES.REQUEST_EDITOR,
      (_payload) => storageConfig.requestEditorReportName,
      {
        reportTitle: getReportMeta(REPORT_TYPES.REQUEST_EDITOR).title,
        reportUrl: getReportMeta(REPORT_TYPES.REQUEST_EDITOR).url
      }
    )
  )
]
