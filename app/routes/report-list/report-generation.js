const { get, drop } = require('../../cache')
const generateReportByType = require('../../reporting')
const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
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
          return h.response({ status: 'not-found' }).code(404)
        }

        return h.response({ status: result.status }) // Example: { status: "preparing" | "ready" | "failed" }
      } catch (err) {
        console.error('Error fetching report status from cache:', err)
        return h.response({ status: 'failed' }).code(500)
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
        return h.response('Report not ready').code(202) // Accepted
      }

      await drop(request, jobId)

      const { filename, reportType } = result
      const { filename: csvFileName, responseStream } = await generateReportByType(reportType, filename)

      return h.response(responseStream)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${csvFileName}"`)
        .header('Transfer-Encoding', 'chunked')
    }
  }
})

module.exports = [createDownloadRoute(), createReportStatusRoute()]
