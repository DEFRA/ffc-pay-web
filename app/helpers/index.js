const { addDetailsToFilename } = require('./add-details-to-filename')
const { buildReportUrl } = require('./build-query-url')
const { convertDateToDDMMYYYY } = require('./convert-date-to-ddmmyyyy')
const convertToCSV = require('./convert-to-csv')
const { formatDateFromString, formatDateFromParts } = require('./date-time-formatter')
const { getPoundValue } = require('./get-pound-value')
const { filterAndPaginateHolds } = require('./filter-and-paginate-holds')
const { getSchemes } = require('./get-schemes')
const { getView } = require('./get-view')
const { handleCSVResponse } = require('./handle-csv-response')
const { handleStreamResponse } = require('./handle-stream-response')
const { readableStreamReturn } = require('./readable-stream-return')
const { renderErrorPage } = require('./render-error-page')
const { createFormRoute, createDownloadRoute } = require('./report-route-generator')
const { generateReportHandler } = require('./generate-report-handler')
const { sanitizeSchemes } = require('./sanitize-schemes')
const { groupHoldCategoriesByScheme } = require('./group-hold-categories-by-scheme')
const { getSchemesForClosures } = require('./get-schemes-for-closures')

module.exports = {
  addDetailsToFilename,
  buildReportUrl,
  convertDateToDDMMYYYY,
  convertToCSV,
  formatDateFromString,
  formatDateFromParts,
  filterAndPaginateHolds,
  getPoundValue,
  getSchemes,
  getSchemesForClosures,
  getView,
  groupHoldCategoriesByScheme,
  handleCSVResponse,
  handleStreamResponse,
  readableStreamReturn,
  renderErrorPage,
  createFormRoute,
  createDownloadRoute,
  generateReportHandler,
  sanitizeSchemes
}
