const REPORT_LIST = require('../../constants/report-list')
const REPORTS_VIEWS = require('../../constants/report-views')
const REPORTS_HANDLER = require('../../constants/report-handlers')
const REPORT_FIELDS = require('../../constants/request-editor-report-fields')

const {
  addDetailsToFilename,
  createReportHandler,
  handleCSVResponse,
  renderErrorPage,
  getView,
  handleStreamResponse
} = require('../../helpers')

const storageConfig = require('../config/storage')

const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const CreateRequestEditorReport = () => ({
  method: 'GET',
  path: REPORT_LIST.REQUEST_EDITOR_REPORT,
  options: {
    auth: AUTH_SCOPE,
    handler: getRequestEditorReportHandler
  }
})

const getRequestEditorReportHandler = createReportHandler(
  REPORTS_HANDLER.REQUEST_EDITOR_REPORT,
  REPORT_FIELDS,
  () => storageConfig.requestEditorReportName,
  REPORTS_VIEWS.REPORT_UNAVAILABLE
)

module.exports = [CreateRequestEditorReport]
