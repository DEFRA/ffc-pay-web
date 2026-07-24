const DOWNLOAD_REPORT_LIST = require('../../constants/download-report-list')
const REPORT_TYPES = require('../../constants/report-types')

const {
  createDownloadRoute,
  generateReportHandler
} = require('../../helpers')

const { storageConfig } = require('../../config')

module.exports = [
  createDownloadRoute(
    DOWNLOAD_REPORT_LIST.REQUEST_EDITOR_REPORT,
    undefined,
    undefined,
    generateReportHandler(
      REPORT_TYPES.REQUEST_EDITOR,
      (_payload) => storageConfig.requestEditorReportName,
      {
        reportTitle: 'Request Editor report',
        reportUrl: '/download-report-list',
        loadingView: 'report-loading/report-loading',
        reportsUrl: '/download-report-list'
      }
    )
  )
]
