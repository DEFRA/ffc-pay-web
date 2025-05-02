const Boom = require('@hapi/boom')
const { v4: uuidv4 } = require('uuid')
const { set } = require('../cache')
const { generateReport } = require('../reporting/get-ap-ar-report')
const { BAD_REQUEST } = require('../constants/http-status')

const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')

const handleValidationError = async (request, h, err, reportName) => {
  request.log(['error', 'validation'], err)
  const errors =
    err.details?.map(detail => ({
      text: detail.message,
      href: '#' + detail.path[0]
    })) || []
  return h
    .view(`reports-list/${reportName}`, { errors })
    .code(BAD_REQUEST)
    .takeover()
}

const apListingSchema = require('./schemas/ap-listing-schema')

const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const createGetRoute = reportName => ({
  method: 'GET',
  path: `/report-list/${reportName}`,
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => h.view(`reports-list/${reportName}`)
  }
})

const createSubmitRoute = reportName => ({
  method: 'POST',
  path: `/report-list/${reportName}`,
  options: {
    auth: AUTH_SCOPE,
    validate: {
      payload: apListingSchema,
      failAction: async (request, h, err) => handleValidationError(request, h, err, reportName)
    },
    handler: async (request, h) => {
      const jobId = uuidv4()
      const { payload } = request
      await set(request, jobId, 'preparing')

      await generateReport(reportName, payload, jobId) // Kicks off async
      return h.redirect(`/report-list/${reportName}/status/${jobId}`)
    }
  }
})

// const createStatusPageRoute = reportName => ({
//   method: 'GET',
//   path: `/report-list/${reportName}/status/{jobId}`,
//   options: {
//     auth: AUTH_SCOPE,
//     handler: async (request, h) => {
//       const { jobId } = request.params
//       return h.view('reports-list/progress', {
//         jobId,
//         reportName
//       })
//     }
//   }
// })

// const createStatusPollRoute = reportName => ({
//   method: 'GET',
//   path: `/report-list/${reportName}/status/{jobId}/check`,
//   options: {
//     auth: AUTH_SCOPE,
//     handler: async (request, h) => {
//       const { jobId } = request.params
//       const status = await getStatus(jobId)
//       if (!status) {
//         return Boom.notFound('Job not found')
//       }
//       return h.response(status)
//     }
//   }
// })

// const createDownloadRoute = reportName => ({
//   method: 'GET',
//   path: `/report-list/${reportName}/download/{jobId}`,
//   options: {
//     auth: AUTH_SCOPE,
//     handler: async (request, h) => {
//       const { jobId } = request.params
//       const status = await getStatus(jobId)
//       if (!status || status.status !== 'ready') {
//         return Boom.badRequest('Report not ready')
//       }

//       const blobStream = await getDataRequestFile(status.blobName) // 🔥 Azure Blob fetch 🔥
//       const filename = `${status.filename}`

//       return h.response(blobStream.readableStreamBody)
//         .header('Content-Type', 'text/csv')
//         .header('Content-Disposition', `attachment; filename="${filename}"`)
//     }
//   }
// })

module.exports = reportName => [
  createGetRoute(reportName),
  createSubmitRoute(reportName)
  // createStatusPageRoute(reportName),
  // createStatusPollRoute(reportName),
  // createDownloadRoute(reportName)
]
