const { postAlerting, getAlertingData } = require('../api')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { getAlertRecipientViewData } = require('./get-alert-recipient-view-data')
const { isEmailTaken, isEmailBlocked } = require('./validation')

const NON_ALERT_FIELDS = new Set([
  'contactId',
  'emailAddress',
  'schemeId',
  'selectView',
  'action',
  'crumb'
])

const getAllAlertTypes = async () => {
  const response = await getAlertingData('/alert-types')
  return response?.payload?.alertTypes ?? []
}

const addAlertTypeToData = (data, alertType, keyNumber) => {
  if (!data[alertType]) {
    data[alertType] = []
  }

  data[alertType].push(keyNumber)
}

const processPayloadEntry = async (
  data,
  key,
  value,
  allAlertTypes
) => {
  if (NON_ALERT_FIELDS.has(key)) {
    return
  }

  if (key === 'globalAlerts') {
    const globalAlertTypes = Array.isArray(value)
      ? value
      : [value]

    for (const alertType of globalAlertTypes) {
      addAlertTypeToData(data, alertType, 0)
    }

    return
  }

  if (
    typeof value !== 'string' &&
    !Array.isArray(value)
  ) {
    return
  }

  let alertTypes = typeof value === 'string'
    ? [value]
    : value

  if (alertTypes.includes('all')) {
    alertTypes = allAlertTypes.filter(
      (alertType) => alertType !== 'scheme_added'
    )
  }

  for (const alertType of alertTypes) {
    addAlertTypeToData(
      data,
      alertType,
      Number(key)
    )
  }
}

const addEmptyAlertTypes = (
  data,
  allAlertTypes
) => {
  for (const alertType of allAlertTypes) {
    if (!Object.hasOwn(data, alertType)) {
      data[alertType] = []
    }
  }
}

const getSelectedAlertTypeKeys = (data) =>
  Object.keys(data).filter(
    (key) =>
      ![
        'emailAddress',
        'contactId',
        'modifiedBy'
      ].includes(key)
  )

const buildUpdateData = async (
  payload,
  contactId,
  modifiedBy
) => {
  const data = {
    emailAddress: payload.emailAddress,
    modifiedBy
  }

  const isExistingContact =
    contactId !== undefined &&
    contactId !== null &&
    contactId !== ''

  /*
   * Manage by recipient sends the complete alert
   * configuration and has no schemeId.
   *
   * Manage by scheme is a partial update and includes
   * schemeId, so omitted alert types must not be cleared.
   */
  const isFullRecipientUpdate =
    isExistingContact &&
    (
      payload.schemeId === undefined ||
      payload.schemeId === null ||
      payload.schemeId === ''
    )

  if (isExistingContact) {
    data.contactId = contactId
  }

  const allAlertTypes = await getAllAlertTypes()

  for (const [key, value] of Object.entries(payload)) {
    await processPayloadEntry(
      data,
      key,
      value,
      allAlertTypes
    )
  }

  const selectedAlertTypeKeys = getSelectedAlertTypeKeys(data)

  const hasSelectedAlertType =
    selectedAlertTypeKeys.some(
      (key) =>
        Array.isArray(data[key]) &&
        data[key].length > 0
    )

  if (!hasSelectedAlertType) {
    throw new Error(
      'At least one alert type must be selected.'
    )
  }

  /*
   * On a full recipient edit, an omitted alert means the
   * recipient unticked every scheme for that alert type.
   * Empty arrays tell ffc-pay-alerting to clear the stored
   * subscription instead of leaving it unchanged.
   */
  if (isFullRecipientUpdate) {
    addEmptyAlertTypes(
      data,
      allAlertTypes
    )
  }

  return data
}

const returnErrorView = async (
  h,
  contactId,
  modifiedBy,
  error
) => {
  const minimalRequest = {
    query: { contactId },
    auth: {
      credentials: {
        account: {
          name: modifiedBy
        }
      }
    }
  }

  const viewData =
    await getAlertRecipientViewData(
      minimalRequest
    )

  return h
    .view('alerts/update', {
      ...viewData,
      error: error?.message ?? String(error)
    })
    .code(BAD_REQUEST)
    .takeover()
}

const updateAlertUser = async (
  modifiedBy,
  payload,
  h,
  redirectPath,
  errorRedirectPath
) => {
  const {
    emailAddress,
    contactId
  } = payload

  try {
    await isEmailTaken(
      emailAddress,
      contactId
    )

    isEmailBlocked(emailAddress)

    const data = await buildUpdateData(
      payload,
      contactId,
      modifiedBy
    )

    await postAlerting(
      '/update-contact',
      data,
      null
    )

    return h.redirect(
      redirectPath ||
      `/alerts/manage-by-recipient?updated=${encodeURIComponent(
        contactId
      )}`
    )
  } catch (err) {
    if (errorRedirectPath) {
      return h
        .redirect(errorRedirectPath(err))
        .takeover()
    }

    return returnErrorView(
      h,
      contactId,
      modifiedBy,
      err
    )
  }
}

module.exports = {
  updateAlertUser
}
