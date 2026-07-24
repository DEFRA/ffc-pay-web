const moment = require('moment')
const { getRetentionData } = require('../api')

const defaultPage = 1
const defaultPageSize = 2500

const getClosures = async ({
  page = defaultPage,
  pageSize = defaultPageSize,
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
