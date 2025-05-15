const REPORT_LIST = require('../../constants/report-list')
const REPORT_TYPES = require('../../constants/report-types')
const REPORTS_VIEWS = require('../../constants/report-views')

const { getReportMeta } = require('../../helpers/get-report-meta')

const {
  createDownloadRoute,
  generateReportHandler
} = require('../../helpers')

const storageConfig = require('../../config').storageConfig

const requestEditorReportMeta = getReportMeta(REPORT_TYPES.REQUEST_EDITOR)

module.exports = [
  createDownloadRoute(
    REPORT_LIST.REQUEST_EDITOR_REPORT,
    REPORTS_VIEWS.REPORT_VALIDATION_ERROR,
    undefined,
    generateReportHandler(
      REPORT_TYPES.REQUEST_EDITOR,
      (_payload) => storageConfig.requestEditorReportName,
      {
        reportTitle: requestEditorReportMeta.title,
        reportUrl: requestEditorReportMeta.url
      }
    )
  )
]
