const REPORT_LIST = require('../../constants/report-list')
const REPORT_VIEWS = require('../../constants/report-views')
const { mapStatusReportsToTaskList } = require('../../helpers/map-status-report-to-task-list')
const { getStatusReport, getReportsByYearAndType, getValidReportYears } = require('../../storage/docs-reports')
const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const { handleStreamResponse } = require('../../helpers')

const authOptions = { scope: [schemeAdmin, holdAdmin, dataView] }

const typeDisplayNames = {
  'sustainable-farming-incentive': 'SFI-23',
  'delinked-payment-statement': 'Delinked'
}

const getReportTitle = (type, year) => {
  const displayName = typeDisplayNames[type] || type
  return `${displayName} Status Reports - ${year}`
}

module.exports = [
  {
    method: 'GET',
    path: REPORT_LIST.STATUS,
    options: {
      auth: authOptions,
      handler: async (_request, h) => {
        const years = await getValidReportYears()
        return h.view(REPORT_VIEWS.STATUS, { years })
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.STATUS_SEARCH,
    options: {
      auth: authOptions,
      handler: async (request, h) => {
        const { 'select-type': type, 'report-year': year } = request.query
        const reports = await getReportsByYearAndType(year, type)

        const reportTitle = getReportTitle(type, year)
        const govukTaskListData = {
          idPrefix: 'report-list',
          items: mapStatusReportsToTaskList(reports)
        }

        return h.view(REPORT_VIEWS.STATUS_RESULTS, { reportTitle, govukTaskListData })
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.STATUS_DOWNLOAD,
    options: {
      auth: authOptions,
      handler: async (request, h) => {
        const filename = request.query['file-name']
        return handleStreamResponse(() => getStatusReport(filename), filename, h)
      }
    }
  }
]
