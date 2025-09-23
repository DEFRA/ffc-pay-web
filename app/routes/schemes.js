const { getProcessingData, postProcessing } = require('../api')
const Joi = require('joi')
const ViewModel = require('./models/update-scheme')
const { applicationAdmin, schemeAdmin } = require('../auth/permissions')
const { BAD_REQUEST } = require('../constants/http-status-codes')

const PAYMENT_SCHEMES = '/payment-schemes'
const UPDATE_PAYMENT_SCHEME = '/update-payment-scheme'

const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin] }

module.exports = [
  {
    method: 'GET',
    path: PAYMENT_SCHEMES,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        const schemes = await getProcessingData(PAYMENT_SCHEMES)
        const schemesPayload = schemes.payload.paymentSchemes
        for (const scheme of schemesPayload) {
          if (scheme.name === 'SFI') {
            scheme.name = 'SFI22'
          }
        }
        return h.view('payment-schemes', { schemes: schemesPayload })
      }
    }
  },
  {
    method: 'POST',
    path: PAYMENT_SCHEMES,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const active = request.payload.active
        const schemeId = request.payload.schemeId
        const name = request.payload.name
        return h.redirect(
          `/update-payment-scheme?schemeId=${schemeId}&active=${active}&name=${name}`
        )
      }
    }
  },
  {
    method: 'GET',
    path: UPDATE_PAYMENT_SCHEME,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        query: Joi.object({
          schemeId: Joi.number().required(),
          name: Joi.string().required(),
          active: Joi.boolean().required()
        })
      },
      handler: async (request, h) => {
        return h.view('update-payment-scheme', new ViewModel(request.query))
      }
    }
  },
  {
    method: 'POST',
    path: UPDATE_PAYMENT_SCHEME,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: Joi.object({
          confirm: Joi.boolean().required(),
          schemeId: Joi.number().required(),
          name: Joi.string().required(),
          active: Joi.boolean().required()
        }),
        failAction: async (request, h, error) => {
          return h
            .view(
              'update-payment-scheme',
              new ViewModel(request.payload, error)
            )
            .code(BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        if (request.payload.confirm) {
          await postProcessing('/change-payment-status', {
            schemeId: request.payload.schemeId,
            active: !request.payload.active
          })
        }
        return h.redirect(PAYMENT_SCHEMES)
      }
    }
  }
]
