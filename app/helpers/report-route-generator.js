const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const {
  renderErrorPage,
  getView
} = require('./')

const createFormRoute = (path, returnViewRoute) => ({
  method: 'GET',
  path: path,
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      return getView(returnViewRoute, h)
    }
  }
})

const createDownloadRoute = (path, viewOnFail, validationSchema, requestHandler) => ({
  method: 'POST',
  path: path,
  options: {
    auth: AUTH_SCOPE,
    validate: {
      query: validationSchema,
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
