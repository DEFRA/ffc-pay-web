const Boom = require('@hapi/boom')
const Path = require('path')
const REPORT_LIST = require('../../constants/report-list')
const REPORT_VIEWS = require('../../constants/report-views')
const { mapStatusReportsToTaskList } = require('../../helpers/map-status-report-to-task-list')
const { getStatusReport, getReportsByYearAndType, getValidReportYearsByType } = require('../../storage/doc-reports')
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
    display: 'De-linked',
    scope: statusReportsDelinked
  }
}

const getReportTitle = (type, year) => {
  const displayName = reportTypes[type]?.display || type
  return `${displayName} Payment Status Reports - ${year}`
}

module.exports = [
  {
    method: 'GET',
    path: REPORT_LIST.STATUS,
    options: {
      auth: authOptions,
      handler: async (request, h) => {
        try {
          const yearTypeItems = await getValidReportYearsByType()
          const userScopes = request.auth.credentials.scope || []

          const reportTypeItems = Object.entries(reportTypes)
            .filter(([_, { scope }]) => userScopes.includes(scope))
            .map(([value, { display }]) => ({
              value,
              text: display
            }))

          return h.view(REPORT_VIEWS.STATUS, {
            reportTypeItems,
            yearTypeItems
          })
        } catch (error) {
          console.error('Error fetching reports', error)
          throw Boom.internal('Unable to retrieve the report data from the server. Please try again later.')
        }
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
        const fullPath = request.query['file-name']
        const filename = Path.basename(fullPath)
        return handleStreamResponse(() => getStatusReport(fullPath), filename, h)
      }
    }
  }
]
