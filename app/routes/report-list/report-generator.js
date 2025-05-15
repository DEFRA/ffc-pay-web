const { get } = require('../../cache')
const { generateReport } = require('../../reporting')
const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const setReportStatus = require('../../helpers/set-report-status')

const HTTP_STATUS = require('../../constants/http-status')
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const createReportStatusRoute = () => ({
  method: 'GET',
  path: '/report-list/generation/status/{jobId}',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      const jobId = request.params.jobId

      try {
        const result = await get(request, jobId)

        if (!result) {
          return h.response({ status: 'not-found' }).code(HTTP_STATUS.NOT_FOUND)
        }

        return h.response({ status: result.status }) // Example: { status: "preparing" | "ready" | "failed" }
      } catch (err) {
        console.error('Error fetching report status from cache:', err)
        return h.response({ status: 'failed' }).code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }
    }
  }
})

const createDownloadRoute = () => ({
  method: 'GET',
  path: '/report-list/generation/download/{jobId}',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      const jobId = request.params.jobId
      const result = await get(request, jobId)

      if (!result || result.status !== 'ready') {
        return h.response('Report not ready').code(HTTP_STATUS.ACCEPTED)
      }

      const { reportType, returnedFilename, reportFilename } = result

      const setStatusCallback = () => {
        setReportStatus(request, jobId, {
          status: 'completed'
        })
      }

      const responseStream = await generateReport(returnedFilename, reportType, setStatusCallback)

      console.debug(`Writing response stream to ${reportFilename}.`)

      return h.response(responseStream)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${reportFilename}"`)
        .header('Transfer-Encoding', 'chunked')
    }
  }
})

module.exports = [createDownloadRoute(), createReportStatusRoute()]
