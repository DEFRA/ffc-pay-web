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
      return getView(returnViewRoute, h)
    }
  }
})

const createDownloadRoute = (path, viewOnFail, validationSchema, requestHandler) => {
  const options = {
    auth: AUTH_SCOPE,
    handler: requestHandler
  }
  if (validationSchema) {
    options.validate = {
      query: validationSchema,
      failAction: async (request, h, err) => {
        return renderErrorPage(viewOnFail, request, h, err)
      }
    }
  }

  return {
    method: 'GET',
    path,
    options
  }
}

module.exports = { createFormRoute, createDownloadRoute }
