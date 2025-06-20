const { get, drop } = require('../cache')
const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')

const HTTP_STATUS = require('../constants/http-status')
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const createGetLoadingStatusRoute = () => ({
  method: 'GET',
  path: '/loading/{jobId}',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      const jobId = request.params.jobId

      try {
        const result = await get(request, jobId)

        if (!result) {
          return h.response({ status: 'not-found' }).code(HTTP_STATUS.NOT_FOUND)
        }

        return h.response({ status: result.status, ...(result.message != null && { message: result.message }) }).code(HTTP_STATUS.SUCCESS)
      } catch (err) {
        console.error(`Error getting ${jobId} from cache:`, err)
        return h.response({ status: 'failed', message: err.message }).code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }
    }
  }
})

const createDropLoadingStatusRoute = () => ({
  method: 'DELETE',
  path: '/loading/{jobId}',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      const jobId = request.params.jobId

      try {
        await drop(request, jobId)

        return h.response().code(HTTP_STATUS.SUCCESS)
      } catch (err) {
        console.error(`Error droping ${jobId} from cache:`, err)
        return h.response({ status: 'failed' }).code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }
    }
  }
})

module.exports = [createGetLoadingStatusRoute(), createDropLoadingStatusRoute()]
