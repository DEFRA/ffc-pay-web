const {
  updateAlertUser,
  removeAlertUser,
  getContactsByScheme,
  getAlertUpdateViewData
} = require('../alerts')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const userSchema = require('./schemas/user-schema')
const removeUserSchema = require('./schemas/remove-user-schema')
const { getAlertingData } = require('../api')

const paths = {
  alerts: '/alerts',
  information: '/alerts/information',
  update: '/alerts/update'
}

const views = {
  alerts: 'alerts',
  information: 'alerts/information',
  update: 'alerts/update'
}

module.exports = [
  {
    method: 'GET',
    path: paths.alerts,
    options: {
      handler: async (_request, h) => {
        const schemes = await getContactsByScheme()
        return h.view(views.alerts, { schemes })
      }
    }
  },
  {
    method: 'GET',
    path: paths.information,
    options: {
      handler: async (_request, h) => {
        const alertDescriptionsResponse = await getAlertingData('/alert-descriptions')
        const alertDescriptions = alertDescriptionsResponse?.payload?.alertDescriptions ?? []
        return h.view(views.information, { alertDescriptions })
      }
    }
  },
  {
    method: 'GET',
    path: paths.update,
    options: {
      handler: async (request, h) => {
        const viewData = await getAlertUpdateViewData(request)
        return h.view(views.update, viewData)
      }
    }
  },
  {
    method: 'POST',
    path: paths.update,
    handler: async (request, h) => {
      const user = request.auth?.credentials.account
      const userNameOrEmail = user?.name || user?.username || user?.email
      const action = request.payload.action

      try {
        if (action === 'remove') {
          return await removeAlertUser(userNameOrEmail, request.payload.contactId, h)
        } else {
          return await updateAlertUser(userNameOrEmail, request.payload, h)
        }
      } catch (error) {
        const viewData = await getAlertUpdateViewData(request)
        return h
          .view(views.update, { ...viewData, error })
          .code(BAD_REQUEST)
      }
    },
    options: {
      validate: {
        payload: async (value, _options) => {
          if (value.action === 'remove') {
            const { error } = removeUserSchema.validate(value)
            if (error) {
              throw error
            }
          } else {
            const { error } = userSchema.validate(value)
            if (error) {
              throw error
            }
          }
          return value
        },
        failAction: async (request, h, error) => {
          const viewData = await getAlertUpdateViewData(request)
          return h
            .view(views.update, { ...viewData, error })
            .code(BAD_REQUEST)
            .takeover()
        }
      }
    }
  }
]
