const { addDetailsToFilename } = require('./add-details-to-filename')
const { buildQueryUrl } = require('./build-query-url')
const { convertDateToDDMMYYYY } = require('./convert-date-to-ddmmyyyy')
const convertToCSV = require('./convert-to-csv')
const { createReportHandler } = require('./create-report-handler')
const { fetchDataAndRespond } = require('./fetch-data-and-respond')
const formatDate = require('./format-date')
const { getPoundValue } = require('./get-pound-value')
const { getSchemes } = require('./get-schemes')
const { getView } = require('./get-view')
const { handleCSVResponse } = require('./handle-csv-response')
const { handleStreamResponse } = require('./handle-stream-response')
const { mapReportData } = require('./map-report-data')
const { readableStreamReturn } = require('./readable-stream-return')
const { renderErrorPage } = require('./render-error-page')
const { sanitizeData } = require('./sanitize-data')
const { createFormRoute, createDownloadRoute } = require('./report-route-generator')

module.exports = {
  addDetailsToFilename,
  buildQueryUrl,
  convertDateToDDMMYYYY,
  convertToCSV,
  createReportHandler,
  fetchDataAndRespond,
  formatDate,
  getPoundValue,
  getSchemes,
  getView,
  handleCSVResponse,
  handleStreamResponse,
  mapReportData,
  readableStreamReturn,
  renderErrorPage,
  sanitizeData,
  createFormRoute,
  createDownloadRoute
}
