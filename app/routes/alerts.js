const Joi = require('joi')
const { getSchemeNameFromSchemeId } = require('ffc-pay-schemes')
const {
  updateAlertUser,
  removeAlertUser,
  getAlertsByScheme,
  getAlertRecipientViewData,
  getAlertRemoveViewData
} = require('../alerts')
const { BAD_REQUEST, NOT_AUTHORIZED, NOT_FOUND, PRECONDITION_FAILED } = require('../constants/http-status-codes')
const { getAlertingData } = require('../api')
const {
  PAYMENT_ALERTS_LINKS,
  PAYMENT_ALERTS_BY_RECIPIENT_LINKS
} = require('../constants/section-links')
const { getSchemes } = require('../helpers')
const { AUTH_SCOPE, paths, views, handleAlertingError, validateUserPayload, getValidationRedirect, getSchemeSummaries, formatAlertType, validateRemovePayload, getValidationError, sanitiseValidationError, getAccountName, createConfirmationView, createSaveRoute } = require('../alerts/alert-route-helpers')

module.exports = [
  {
    method: 'GET',
    path: paths.manage,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      try {
        const cards = [...PAYMENT_ALERTS_LINKS]
        cards.shift()

        const updated = request.query?.updated
        let emailAddress

        if (updated) {
          const contact = await getAlertingData(
            `/contact/${encodeURIComponent(updated)}`
          )
          emailAddress = contact?.payload?.contact?.emailAddress
        }

        return h.view(views.manage, {
          cards,
          updated,
          emailAddress
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  },
  {
    method: 'GET',
    path: paths.manageByScheme,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      try {
        const schemes = await getSchemes()

        return h.view(views.manageByScheme, {
          schemes,
          schemeName: request.query?.schemeName,
          emailAddress: request.query?.emailAddress
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  },
  {
    method: 'GET',
    path: paths.alertsByScheme,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      const { schemeId } = request.query

      if (!schemeId) {
        const schemes = getSchemes()

        return h
          .view(views.alertsByScheme, {
            error: 'Select a scheme',
            data: schemes?.payload?.paymentSchemes
          })
          .code(PRECONDITION_FAILED)
      }

      try {
        const schemes = getSchemes()

        const scheme = schemes?.payload?.paymentSchemes?.find(
          x => String(x.schemeId) === String(schemeId)
        )

        if (!scheme) {
          return h
            .view(views.alertsByScheme, {
              error: `No scheme found for Scheme ID ${schemeId}`,
              schemeId,
              data: schemes?.payload?.paymentSchemes
            })
            .code(PRECONDITION_FAILED)
        }

        const alertsForScheme = await getAlertsByScheme(schemeId)

        return h.view(views.alertsByScheme, {
          types: alertsForScheme.formattedTypes,
          schemeName: alertsForScheme.schemeName,
          schemeId,
          successMessage:
            request.query?.success === 'true'
              ? `${request.query.emailAddress} will now receive email alerts for ${alertsForScheme.schemeName}.`
              : undefined
        })
      } catch (error) {
        const schemes = getSchemes()

        return h
          .view(views.alertsByScheme, {
            error: error.data?.payload?.message ?? error.message,
            schemeId,
            data: schemes?.payload?.paymentSchemes
          })
          .code(PRECONDITION_FAILED)
      }
    }
  },
  {
    method: 'GET',
    path: paths.information,
    options: { auth: AUTH_SCOPE },
    handler: async (_request, h) => {
      try {
        const response = await getAlertingData('/alert-descriptions')

        return h.view(views.information, {
          alertDescriptions: response?.payload?.alertDescriptions ?? []
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  },
  {
    method: 'GET',
    path: paths.update,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      try {
        const data = await getAlertRecipientViewData(request, {
          loadContact:
            request.query?.action !== 'create' &&
            Boolean(
              request.query?.contactId || request.query?.emailAddress
            )
        })

        let successMessage

        if (request.query?.success === 'true') {
          successMessage = request.query?.successAction === 'create'
            ? `${data.emailAddress} will now receive the selected email alerts.`
            : `Alerts for ${data.emailAddress} have been updated.`
        }

        return h.view(views.update, {
          ...data,
          action: 'edit',
          error: sanitiseValidationError(request.query?.validationError),
          successMessage
        })
      } catch (error) {
        console.error('Failed to load alert recipient', error)

        return h.redirect(
          `${paths.update}?emailAddress=${encodeURIComponent(
            request.query?.emailAddress || ''
          )}&validationError=true`
        )
      }
    }
  },
  {
    method: 'POST',
    path: paths.updateConfirm,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: validateUserPayload,
        failAction: async (request, h, error) =>
          h
            .redirect(getValidationRedirect(paths.update, request, error))
            .takeover()
      }
    },
    handler: async (request, h) => {
      try {
        const data = await getAlertRecipientViewData(request)

        return h.view(views.updateConfirm, {
          ...data,
          contactId: request.payload.contactId,
          emailAddress: request.payload.emailAddress,
          action: request.payload.action,
          formPath: paths.update,
          formAction: paths.update,
          schemes: getSchemeSummaries(
            data.schemesPayload,
            request.payload
          ),
          formatAlertType
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  },
  {
    method: 'POST',
    path: paths.update,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: async (value) =>
          value.action === 'remove'
            ? validateRemovePayload(value)
            : validateUserPayload(value),
        failAction: async (request, h, error) => {
          if (request.payload.action !== 'remove') {
            return h
              .redirect(getValidationRedirect(paths.update, request, error))
              .takeover()
          }

          try {
            const data = await getAlertRecipientViewData(request)

            return h
              .view(views.update, {
                ...data,
                action: request.payload.action,
                error: getValidationError(error)
              })
              .code(BAD_REQUEST)
              .takeover()
          } catch (viewError) {
            return handleAlertingError(viewError)
          }
        }
      }
    },
    handler: async (request, h) => {
      try {
        if (request.payload.action === 'remove') {
          return await removeAlertUser(
            getAccountName(request),
            request.payload.contactId,
            request.payload.emailAddress,
            h
          )
        }
        const successRedirectParams = new URLSearchParams({
          emailAddress: request.payload.emailAddress,
          success: 'true',
          successAction: request.payload.action
        })

        if (request.payload.contactId) {
          successRedirectParams.set('contactId', request.payload.contactId)
        }

        return await updateAlertUser(
          getAccountName(request),
          request.payload,
          h,
          `${paths.update}?${successRedirectParams.toString()}`
        )
      } catch (error) {
        try {
          const data = await getAlertRecipientViewData(request)

          return h
            .view(views.update, {
              ...data,
              action: request.payload.action,
              error: getValidationError(error)
            })
            .code(BAD_REQUEST)
        } catch (viewError) {
          return handleAlertingError(viewError)
        }
      }
    }
  },
  {
    method: 'GET',
    path: paths.addRecipientByScheme,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      try {
        const data = await getAlertRecipientViewData(request)
        const schemeName = getSchemeNameFromSchemeId(
          data.schemeId
        )

        if (!schemeName) {
          const schemes = getSchemes()

          return h
            .view(views.addRecipientByScheme, {
              error: `No scheme found for Scheme ID ${data.schemeId}`,
              data: schemes?.payload?.paymentSchemes
            })
            .code(PRECONDITION_FAILED)
        }

        return h.view(views.addRecipientByScheme, {
          ...data,
          action: 'create',
          error: sanitiseValidationError(request.query?.validationError),
          schemeName,
          pageTitle: `Add new alert recipient for ${schemeName}`,
          formAction: paths.addRecipientBySchemeConfirm
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  },
  createConfirmationView(
    paths.addRecipientBySchemeConfirm,
    views.addRecipientBySchemeConfirm,
    paths.addRecipientByScheme,
    paths.addRecipientByScheme,
    'create',
    'Check recipient email and alert details before saving'
  ),
  createSaveRoute(
    paths.addRecipientByScheme,
    'create',
    async (request) => {
      return `${paths.alertsByScheme}?schemeId=${encodeURIComponent(
        request.payload.schemeId
      )}&emailAddress=${encodeURIComponent(
        request.payload.emailAddress || ''
      )}&success=true`
    }
  ),
  {
    method: 'GET',
    path: paths.removeConfirm,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        query: Joi.object({
          emailAddress: Joi.string()
            .trim()
            .required()
        }),
        failAction: async (request, h, _error) => {
          return h
            .redirect(
              `${paths.removeByRecipient}?emailAddress=${encodeURIComponent(
                request.query?.emailAddress || ''
              )}&validationError=true`
            )
            .takeover()
        }
      }
    },
    handler: async (request, h) => {
      try {
        const data = await getAlertRemoveViewData(request)

        return h.view(views.removeConfirm, data)
      } catch (error) {
        if (
          error?.isBoom &&
          [BAD_REQUEST, NOT_AUTHORIZED, NOT_FOUND].includes(
            error.output?.statusCode
          )
        ) {
          return h.redirect(
            `${paths.removeByRecipient}?emailAddress=${encodeURIComponent(
              request.query?.emailAddress || ''
            )}&validationError=true`
          )
        }

        return handleAlertingError(error)
      }
    }
  },
  {
    method: 'GET',
    path: paths.manageByRecipient,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      try {
        const cards = [...PAYMENT_ALERTS_BY_RECIPIENT_LINKS]
        const updated = request.query?.updated
        let emailAddress

        if (updated) {
          const contact = await getAlertingData(
            `/contact/${encodeURIComponent(updated)}`
          )
          emailAddress = contact?.payload?.contact?.emailAddress
        }

        return h.view(views.manageByRecipient, {
          cards,
          updated,
          removed: request.query?.removed,
          emailAddress
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  },
  {
    method: 'GET',
    path: paths.updateByRecipient,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      const emailAddress = request.query?.emailAddress

      return h.view(views.updateByRecipient, {
        emailAddress,
        error: request.query?.validationError
          ? 'The email address provided is either invalid or not configured to receive alerts'
          : null
      })
    }
  },
  {
    method: 'GET',
    path: paths.removeByRecipient,
    options: { auth: AUTH_SCOPE },
    handler: async (request, h) => {
      const emailAddress = request.query?.emailAddress

      return h.view(views.removeByRecipient, {
        emailAddress,
        error: request.query?.validationError
          ? 'The email address provided is either invalid or not configured to receive alerts'
          : null
      })
    }
  }
]
