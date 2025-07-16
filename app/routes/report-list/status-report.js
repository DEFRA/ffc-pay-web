const REPORT_LIST = require('../../constants/report-list')
const REPORT_VIEWS = require('../../constants/report-views')

const { getStatusReport, getRecentStatusReports } = require('../../storage')
const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const { handleStreamResponse } = require('../../helpers')

const authOptions = { scope: [schemeAdmin, holdAdmin, dataView] }

module.exports = [
  {
    method: 'GET',
    path: REPORT_LIST.STATUS,
    options: {
      auth: authOptions,
      handler: async (_request, h) => {
        const reports = await getRecentStatusReports()
        return h.view(REPORT_VIEWS.STATUS, { reports })
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.STATUS_DOWNLOAD,
    options: {
      auth: authOptions,
      handler: async (request, h) => {
        const reportName = request.query['report-name']
        return handleStreamResponse(() => getStatusReport(reportName), reportName, h)
      }
    }
  }
]
