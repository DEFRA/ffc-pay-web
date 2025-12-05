const Joi = require('joi')
const Boom = require('@hapi/boom')
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
const { applicationAdmin, alertAdmin } = require('../auth/permissions')

const AUTH_SCOPE = { scope: [applicationAdmin, alertAdmin] }

const paths = {
  alerts: '/alerts',
  information: '/alerts/information',
  update: '/alerts/update',
  confirm: '/alerts/confirm-delete'
}

const views = {
  alerts: 'alerts',
  information: 'alerts/information',
  update: 'alerts/update',
  confirm: 'alerts/confirm-delete'
}

const handleAlertingError = (error) => {
  console.error('Alerting Service error:', error)
  return Boom.badGateway(`Alerting Service is unavailable: ${error.message}`)
}

module.exports = [
  {
    method: 'GET',
    path: paths.alerts,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        try {
          const schemes = await getContactsByScheme()
          return h.view(views.alerts, { schemes })
        } catch (error) {
          return handleAlertingError(error)
        }
      }
    }
  },
  {
    method: 'GET',
    path: paths.information,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        try {
          const alertDescriptionsResponse = await getAlertingData('/alert-descriptions')
          const alertDescriptions = alertDescriptionsResponse?.payload?.alertDescriptions ?? []
          return h.view(views.information, { alertDescriptions })
        } catch (error) {
          return handleAlertingError(error)
        }
      }
    }
  },
  {
    method: 'GET',
    path: paths.update,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        try {
          const viewData = await getAlertUpdateViewData(request)
          return h.view(views.update, viewData)
        } catch (error) {
          return handleAlertingError(error)
        }
      }
    }
  },
  {
    method: 'GET',
    path: paths.confirm,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        try {
          const { contactId } = request.query
          const contact = await getAlertingData(`/contact/contactId/${encodeURIComponent(contactId)}`)
          const contactPayload = contact?.payload?.contact ?? {}
          const { emailAddress } = contactPayload
          if (!emailAddress) {
            const schemes = await getContactsByScheme()
            return h.view(views.alerts, { schemes })
          }
          return h.view(views.confirm, { contactId: request.query.contactId, emailAddress })
        } catch (error) {
          return handleAlertingError(error)
        }
      },
      validate: {
        query: Joi.object({
          contactId: Joi.number().integer().required().messages({
            'number.base': 'A user must be specified to remove',
            'any.required': 'A user must be specified to remove'
          })
        }),
        failAction: async (_request, h) => {
          try {
            const schemes = await getContactsByScheme()
            return h.view(views.alerts, { schemes }).takeover()
          } catch (error) {
            return handleAlertingError(error)
          }
        }
      }
    }
  },
  {
    method: 'POST',
    path: paths.update,
    handler: async (request, h) => {
      try {
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
          try {
            const viewData = await getAlertUpdateViewData(request)
            return h
              .view(views.update, { ...viewData, error })
              .code(BAD_REQUEST)
          } catch (err) {
            return handleAlertingError(err)
          }
        }
      } catch (error) {
        return handleAlertingError(error)
      }
    },
    options: {
      auth: AUTH_SCOPE,
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
          try {
            try {
              const viewData = await getAlertUpdateViewData(request)
              return h
                .view(views.update, { ...viewData, error })
                .code(BAD_REQUEST)
                .takeover()
            } catch (err) {
              return handleAlertingError(err)
            }
          } catch (error) {
            return handleAlertingError(error)
          }
        }
      }
    }
  }
]
