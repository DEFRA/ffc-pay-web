const { get } = require('../../cache')
const { generateReport } = require('../../reporting')
const { setStatusCallback } = require('../../reporting/set-status-callback')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')

const HTTP_STATUS = require('../../constants/http-status-codes')
const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView] }

const createDownloadRoute = () => ({
  method: 'GET',
  path: '/report-list/generation/download/{jobId}',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      const jobId = request.params.jobId
      const result = await get(request, jobId)

      if (!result || result.status !== 'download') {
        return h.response('Report not ready').code(HTTP_STATUS.ACCEPTED)
      }

      const { reportType, returnedFilename, reportFilename } = result

      const callback = setStatusCallback(request, jobId)
      const responseStream = await generateReport(returnedFilename, reportType, callback)

      if (!responseStream) {
        return h.response('Report generation failed').code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }

      console.debug(`Writing response stream to ${reportFilename}.`)

      return h.response(responseStream)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${reportFilename}"`)
        .header('Transfer-Encoding', 'chunked')
    }
  }
})

module.exports = [createDownloadRoute()]
