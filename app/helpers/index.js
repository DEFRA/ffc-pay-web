const { addDetailsToFilename } = require('./add-details-to-filename')
const { buildReportUrl } = require('./build-query-url')
const { convertDateToDDMMYYYY } = require('./convert-date-to-ddmmyyyy')
const convertToCSV = require('./convert-to-csv')
const { formatDateFromString, formatDateFromParts } = require('./format-date')
const { getPoundValue } = require('./get-pound-value')
const { getSchemes } = require('./get-schemes')
const { getView } = require('./get-view')
const { handleCSVResponse } = require('./handle-csv-response')
const { handleStreamResponse } = require('./handle-stream-response')
const { readableStreamReturn } = require('./readable-stream-return')
const { renderErrorPage } = require('./render-error-page')
const { createFormRoute, createDownloadRoute } = require('./report-route-generator')
const { generateReportHandler } = require('../reporting/generateReportHandler')

module.exports = {
  addDetailsToFilename,
  buildReportUrl,
  convertDateToDDMMYYYY,
  convertToCSV,
  formatDateFromString,
  formatDateFromParts,
  getPoundValue,
  getSchemes,
  getView,
  handleCSVResponse,
  handleStreamResponse,
  readableStreamReturn,
  renderErrorPage,
  createFormRoute,
  createDownloadRoute,
  generateReportHandler
}
