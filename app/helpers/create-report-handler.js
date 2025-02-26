const { buildQueryUrl } = require('./build-query-url')
const { fetchDataAndRespond } = require('./fetch-data-and-respond')
const api = require('../api')
const { mapReportData } = require('./map-report-data')
const { sanitizeData } = require('./sanitize-data')

const createReportHandler = (path, fields, filenameFunc, errorView) => {
  return async (request, h) => {
    const { schemeId, year, prn, revenueOrCapital, frn } = request.query
    const url = buildQueryUrl(path, schemeId, year, prn, frn, revenueOrCapital)
    return fetchDataAndRespond(
      () => api.getTrackingData(url),
      (response) => {
        const data = sanitizeData(response.payload[Object.keys(response.payload)[0]])
        return data.map(data => mapReportData(data, fields))
      },
      filenameFunc(schemeId, year, prn, revenueOrCapital, frn),
      h,
      errorView
    )
  }
}

module.exports = {
  createReportHandler
}
