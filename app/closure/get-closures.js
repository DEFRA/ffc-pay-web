const moment = require('moment')
const { getRetentionData } = require('../api')

const getClosures = async ({
  page = 1,
  pageSize = 2500,
  frnAgreement = null,
  schemeId = null
} = {}) => {
  const params = new URLSearchParams()

  if (frnAgreement || schemeId) {
    if (frnAgreement) {
      params.append('frnAgreement', frnAgreement)
    }

    if (schemeId) {
      params.append('schemeId', schemeId)
    }
  } else {
    params.append('page', page)
    params.append('pageSize', pageSize)
  }

  const queryString = params.toString()
  const queryUrl = '/closure' + (queryString ? '?' + queryString : '')

  const { payload } = await getRetentionData(queryUrl)

  const closures = payload.closures?.map(closure => {
    closure.endDate = moment(closure.endDate).format('DD/MM/YYYY')

    if (closure.schemeName === 'SFI') {
      closure.schemeName = 'SFI22'
    }

    return closure
  }) ?? []

  return {
    closures,
    count: payload.count ?? 0
  }
}

module.exports = {
  getClosures
}
