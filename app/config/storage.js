const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  connectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  storageAccount: Joi.string().required(),
  projectionContainer: Joi.string().default('payeventstore'),
  reportContainer: Joi.string().default('reports'),
  dataRequestContainer: Joi.string().default('data-requests'),
  useConnectionStr: Joi.boolean().default(false),
  createContainers: Joi.boolean().default(true),
  holdReportName: Joi.boolean().default('ffc-pay-hold-report.csv'),
  miReportName: Joi.string().default('ffc-pay-mi-report-v2.csv'),
  suppressedReportName: Joi.string().default('ffc-pay-suppressed-report.csv'),
  summaryReportName: Joi.string().default('ffc-pay-combined-transaction-report.csv'),
  apListingReportName: Joi.string().default('ffc-pay-ap-listing-report.csv'),
  arListingReportName: Joi.string().default('ffc-pay-ar-listing-report.csv'),
  requestEditorReportName: Joi.string().default('ffc-pay-request-editor-report.csv'),
  claimLevelReportName: Joi.string().default('ffc-pay-claim-level-report.csv'),
  paymentRequestsReportName: Joi.string().default('ffc-pay-requests-statuses-report.csv'),
  sfiStatusReport: Joi.string().default('sustainable-farming-incentive'),
  delinkedStatusReport: Joi.string().default('delinked-payment-statement'),
  managedIdentityClientId: Joi.string().optional()

})

// Build config
const config = {
  connectionStr: process.env.AZURE_STORAGE_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  projectionContainer: process.env.AZURE_STORAGE_CONTAINER_PROJECTION,
  dataRequestContainer: process.env.AZURE_STORAGE_DATA_REQUEST_CONTAINER,
  reportContainer: process.env.AZURE_STORAGE_CONTAINER_REPORT,
  useConnectionStr: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  createContainers: process.env.AZURE_STORAGE_CREATE_CONTAINERS,
  holdReportName: process.env.HOLD_REPORT_NAME,
  miReportName: process.env.MI_REPORT_NAME,
  suppressedReportName: process.env.SUPPRESSED_REPORT_NAME,
  summaryReportName: process.env.SUMMARY_REPORT_NAME,
  apListingReportName: process.env.AP_LISTING_REPORT_NAME,
  arListingReportName: process.env.AR_LISTING_REPORT_NAME,
  requestEditorReportName: process.env.REQUEST_EDITOR_REPORT_NAME,
  claimLevelReportName: process.env.CLAIM_LEVEL_REPORT_NAME,
  paymentRequestsReportName: process.env.PAYMENT_REQUESTS_REPORT_NAME,
  managedIdentityClientId: process.env.AZURE_CLIENT_ID

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
