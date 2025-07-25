const REPORT_LIST = require('../../constants/report-list')
const REPORT_VIEWS = require('../../constants/report-views')
const { mapStatusReportsToTaskList } = require('../../helpers/map-status-report-to-task-list')
const { getStatusReport, getReportsByYearAndType, getValidReportYears } = require('../../storage/doc-reports')
const { statusReportSfi23, statusReportsDelinked } = require('../../auth/permissions')
const { handleStreamResponse } = require('../../helpers')

const authOptions = {
  scope: [statusReportSfi23, statusReportsDelinked]
}

const reportTypes = {
  'sustainable-farming-incentive': {
    display: 'SFI-23',
    scope: statusReportSfi23
  },
  'delinked-payment-statement': {
    display: 'Delinked',
    scope: statusReportsDelinked
  }
}

const getReportTitle = (type, year) => {
  const displayName = reportTypes[type]?.display || type
  return `${displayName} Status Reports - ${year}`
}

module.exports = [
  {
    method: 'GET',
    path: REPORT_LIST.STATUS,
    options: {
      auth: authOptions,
      handler: async (request, h) => {
        const years = await getValidReportYears()
        const userScopes = request.auth.credentials.scope || []

        console.log('User scopes:', userScopes)

        const reportTypeItems = Object.entries(reportTypes)
          .filter(([_, { scope }]) => userScopes.includes(scope))
          .map(([value, { display }]) => ({
            value,
            text: display
          }))

        return h.view(REPORT_VIEWS.STATUS, {
          reportTypeItems,
          years
        })
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
