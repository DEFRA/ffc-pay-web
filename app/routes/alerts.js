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

module.exports = [
  {
    method: 'GET',
    path: '/alerts',
    options: {
      handler: async (request, h) => {
        const schemes = await getContactsByScheme()
        return h.view('alerts', { schemes })
      }
    }
  },
  {
    method: 'GET',
    path: '/alerts/information',
    options: {
      handler: async (request, h) => {
        const alertDescriptionsResponse = await getAlertingData('/alert-descriptions')
        const alertDescriptions = alertDescriptionsResponse?.payload?.alertDescriptions ?? []
        console.log(alertDescriptions)
        return h.view('alerts/information', { alertDescriptions })
      }
    }
  },
  {
    method: 'GET',
    path: '/alerts/update',
    options: {
      handler: async (request, h) => {
        const viewData = await getAlertUpdateViewData(request)
        return h.view('alerts/update', viewData)
      }
    }
  },
  {
    method: 'POST',
    path: '/alerts/update',
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
          .view('alerts/update', { ...viewData, error })
          .code(BAD_REQUEST)
      }
    },
    options: {
      validate: {
        payload: async (value, _options) => {
          console.log(value)
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
            .view('alerts/update', { ...viewData, error })
            .code(BAD_REQUEST)
            .takeover()
        }
      }
    }
  }
]
