const { getPoundValue } = require('../../helpers/get-pound-value')
const { convertDateToDDMMYYYY } = require('../../helpers/convert-date-to-ddmmyyyy')

const mapRequestEditorData = data => ({
  FRN: data.frn,
  deltaAmount: getPoundValue(data.deltaAmount),
  SourceSystem: data.sourceSystem,
  agreementNumber: data.agreementNumber,
  invoiceNumber: data.invoiceNumber,
  PaymentRequestNumber: data.paymentRequestNumber,
  year: data.year,
  receivedInRequestEditor: convertDateToDDMMYYYY(data.receivedInRequestEditor),
  enriched: data.enriched,
  debtType: data.debtType,
  ledgerSplit: data.ledgerSplit,
  releasedFromRequestEditor: convertDateToDDMMYYYY(data.releasedFromRequestEditor)
})

module.exports = { mapRequestEditorData }
