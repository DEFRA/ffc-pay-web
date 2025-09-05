const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  payEventStoreConnectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  payInjectionConnectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  docConnectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  payStorageAccount: Joi.string().required(),
  docStorageAccount: Joi.string().required(),
  projectionContainer: Joi.string().default('payeventstore'),
  reportContainer: Joi.string().default('reports'),
  dataRequestContainer: Joi.string().default('data-requests'),
  statementsContainer: Joi.string().default('statements'),
  manualPaymentsContainer: Joi.string().default('manual'),
  statusReportsFolder: Joi.string().default('reports'),
  useConnectionStr: Joi.boolean().default(false),
  createContainers: Joi.boolean().default(true),
  stagingFolderName: Joi.boolean().default('staging'),
  holdReportName: Joi.boolean().default('ffc-pay-hold-report.csv'),
  miReportName: Joi.string().default('ffc-pay-mi-report-v2.csv'),
  suppressedReportName: Joi.string().default('ffc-pay-suppressed-report.csv'),
  summaryReportName: Joi.string().default('ffc-pay-combined-transaction-report.csv'),
  apListingReportName: Joi.string().default('ffc-pay-ap-listing-report.csv'),
  arListingReportName: Joi.string().default('ffc-pay-ar-listing-report.csv'),
  requestEditorReportName: Joi.string().default('ffc-pay-request-editor-report.csv'),
  claimLevelReportName: Joi.string().default('ffc-pay-claim-level-report.csv'),
  paymentRequestsReportName: Joi.string().default('ffc-pay-requests-statuses-report.csv'),
  sfiStatusReport: Joi.string().default('sustainable-farming-incentive.csv'),
  delinkedStatusReport: Joi.string().default('delinked-payment-statement.csv'),
  managedIdentityClientId: Joi.string().optional()
})

// Build config
const config = {
  payEventStoreConnectionStr: process.env.PAY_EVENT_STORE_AZURE_STORAGE_CONNECTION_STRING,
  payInjectionConnectionStr: process.env.PAY_INJECTION_AZURE_STORAGE_CONNECTION_STRING,
  docConnectionStr: process.env.DOC_AZURE_STORAGE_CONNECTION_STRING,
  payStorageAccount: process.env.PAY_AZURE_STORAGE_ACCOUNT_NAME,
  docStorageAccount: process.env.DOC_AZURE_STORAGE_ACCOUNT_NAME,
  projectionContainer: process.env.AZURE_STORAGE_CONTAINER_PROJECTION,
  dataRequestContainer: process.env.AZURE_STORAGE_DATA_REQUEST_CONTAINER,
  statementsContainer: process.env.AZURE_STORAGE_STATEMENTS_CONTAINER,
  manualPaymentsContainer: process.env.AZURE_STORAGE_MANUAL_PAYMENTS_CONTAINER,
  stagingFolderName: process.env.AZURE_STORAGE_STAGING_FOLDER_NAME,
  statusReportsFolder: process.env.STATUS_REPORTS_FOLDER,
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
