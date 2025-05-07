const { getPoundValue } = require('../../helpers/get-pound-value')
const { convertDateToDDMMYYYY } = require('../../helpers/convert-date-to-ddmmyyyy')

const mapBaseAPARData = data => ({
  Filename: data.daxFileName,
  'Date Time': convertDateToDDMMYYYY(data.lastUpdated),
  Event: data.status,
  FRN: data.frn,
  'Original Invoice Number': data.originalInvoiceNumber,
  'Original Invoice Value': getPoundValue(data.value),
  'Invoice Number': data.invoiceNumber,
  'Invoice Delta Amount': data.deltaAmount,
  'D365 Invoice Imported': data.routedToRequestEditor,
  'D365 Invoice Payment': getPoundValue(data.settledValue),
  'PH Error Status': data.phError,
  'D365 Error Status': data.daxError
})

const mapAPData = data => ({
  ...mapBaseAPARData(data)
})

const mapARData = data => {
  const mapped = { ...mapBaseAPARData(data) }
  delete mapped['D365 Invoice Payment']
  return mapped
}

module.exports = { mapAPData, mapARData }
