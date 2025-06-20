const AP_FIELDS = {
  Filename: 'daxFileName',
  'Date Time': 'lastUpdated',
  Event: 'status',
  FRN: 'frn',
  'Original Invoice Number': 'originalInvoiceNumber',
  'Original Invoice Value': 'value',
  'Invoice Number': 'invoiceNumber',
  'Invoice Delta Amount': 'deltaAmount',
  'D365 Invoice Imported': 'routedToRequestEditor',
  'D365 Invoice Payment': 'settledValue',
  'PH Error Status': 'phError',
  'D365 Error Status': 'daxError'
}

const AR_FIELDS = {
  ...AP_FIELDS
}
delete AR_FIELDS['D365 Invoice Payment']

module.exports = { AP_FIELDS, AR_FIELDS }
