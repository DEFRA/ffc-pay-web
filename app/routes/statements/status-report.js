const Boom = require('@hapi/boom')
const Path = require('node:path')
const REPORT_LIST = require('../../constants/payment-status-report-list')
const { getStatusReport, getReportsByYearAndType } = require('../../storage/doc-reports')
const { applicationAdmin, statusReportSfi23, statusReportsDelinked } = require('../../auth/permissions')
const { handleStreamResponse } = require('../../helpers')

const STATEMENT_VIEWS = {
  STATUS: 'statements/status-report',
  STATUS_RESULTS: 'statements/status-report-results',
  STATUS_DOWNLOAD_PREPARE: 'statements/status-report-download'
}

const AUTH_SCOPE = { scope: [applicationAdmin, statusReportSfi23, statusReportsDelinked] }

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

const getReportTitle = (type) => {
  const displayName = reportTypes[type]?.display || type
  return `${displayName} statement status reports`
}

const formatReportDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatFileSize = (sizeInBytes) => {
  const bytes = Number(sizeInBytes)

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const roundedSize = unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)
  return `${roundedSize} ${units[unitIndex]}`
}

const getFileType = (name) => {
  const extension = Path.extname(name || '').replace('.', '')
  return extension ? extension.toUpperCase() : 'CSV'
}

const buildReportRows = (reports, schemeName) => {
  return reports
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((report) => {
      const encodedName = encodeURIComponent(report.name)

      return {
        date: formatReportDate(report.date),
        fileType: getFileType(report.name),
        fileSize: formatFileSize(report.contentLength),
        prepareHref: `${REPORT_LIST.STATUS_DOWNLOAD_PREPARE}?file-name=${encodedName}&scheme=${encodeURIComponent(schemeName)}`
      }
    })
}

module.exports = [
  {
    method: 'GET',
    path: REPORT_LIST.STATUS,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        try {
          const userScopes = [...(request.auth.credentials.scope || [])]

          if (userScopes.includes(applicationAdmin)) {
            userScopes.push(statusReportSfi23, statusReportsDelinked)
          }

          const reportTypeItems = Object.entries(reportTypes)
            .filter(([_, { scope }]) => userScopes.includes(scope))
            .map(([value, { display }]) => ({
              value,
              text: display
            }))

          return h.view(STATEMENT_VIEWS.STATUS, {
            reportTypeItems
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
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const { 'select-type': type } = request.query

        if (!type) {
          throw Boom.badRequest('A scheme is required to search for status reports.')
        }

        const reports = await getReportsByYearAndType(null, type)
        const schemeName = reportTypes[type]?.display || type
        const reportTitle = getReportTitle(type)
        const reportRows = buildReportRows(reports, schemeName)

        return h.view(STATEMENT_VIEWS.STATUS_RESULTS, {
          reportTitle,
          schemeName,
          reportRows
        })
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.STATUS_DOWNLOAD_PREPARE,
    options: {
      auth: AUTH_SCOPE,
      handler: (request, h) => {
        const fullPath = request.query['file-name']

        if (!fullPath) {
          throw Boom.badRequest('A report filename is required.')
        }

        const filename = Path.basename(fullPath)
        const schemeName = request.query.scheme || 'Selected scheme'

        return h.view(STATEMENT_VIEWS.STATUS_DOWNLOAD_PREPARE, {
          filename,
          schemeName,
          downloadUrl: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=${encodeURIComponent(fullPath)}`,
          startNewSearchUrl: REPORT_LIST.STATUS
        })
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.STATUS_DOWNLOAD,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const fullPath = request.query['file-name']

        if (!fullPath) {
          throw Boom.badRequest('A report filename is required.')
        }

        const filename = Path.basename(fullPath)
        return handleStreamResponse(() => getStatusReport(fullPath), filename, h)
      }
    }
  }
]
