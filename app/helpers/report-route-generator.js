const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const { getView } = require('./get-view')
const { renderErrorPage } = require('./render-error-page')

const createFormRoute = (path, returnViewRoute) => ({
  method: 'GET',
  path,
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      return await getView(returnViewRoute, h)
    }
  }
})

const createDownloadRoute = (path, viewOnFail, validationSchema, requestHandler) => ({
  method: 'POST',
  path,
  options: {
    auth: AUTH_SCOPE,
    validate: {
      payload: validationSchema,
      failAction: async (request, h, err) => {
        return renderErrorPage(
          viewOnFail,
          request,
          h,
          err
        )
      }
    },
    handler: requestHandler
  }
})

module.exports = { createFormRoute, createDownloadRoute }
