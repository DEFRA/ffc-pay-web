const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  connectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  storageAccount: Joi.string().required(),
  projectionContainer: Joi.string().default('payeventstore'),
  reportContainer: Joi.string().default('reports'),
  useConnectionStr: Joi.boolean().default(false),
  createContainers: Joi.boolean().default(true),
  miReportName: Joi.string().default('ffc-pay-mi-report-v2.csv'),
  suppressedReportName: Joi.string().default('ffc-pay-suppressed-report.csv'),
  summaryReportName: Joi.string().default('ffc-pay-combined-transaction-report.csv'),
  apListingReportName: Joi.string().default('ffc-pay-ap-listing-report.csv'),
  arListingReportName: Joi.string().default('ffc-pay-ar-listing-report.csv'),
  requestEditorReportName: Joi.string().default('ffc-pay-request-editor-report.csv')
})

// Build config
const config = {
  connectionStr: process.env.AZURE_STORAGE_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  projectionContainer: process.env.AZURE_STORAGE_CONTAINER_PROJECTION,
  reportContainer: process.env.AZURE_STORAGE_CONTAINER_REPORT,
  useConnectionStr: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  createContainers: process.env.AZURE_STORAGE_CREATE_CONTAINERS,
  miReportName: process.env.MI_REPORT_NAME,
  suppressedReportName: process.env.SUPPRESSED_REPORT_NAME,
  summaryReportName: process.env.SUMMARY_REPORT_NAME,
  apListingReportName: process.env.AP_LISTING_REPORT_NAME,
  arListingReportName: process.env.AR_LISTING_REPORT_NAME
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The blob storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
