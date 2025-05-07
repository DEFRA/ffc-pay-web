const { getPoundValue } = require('../../helpers/get-pound-value')

const mapClaimLevelData = data => ({
  FRN: data.frn,
  claimID: data.claimNumber,
  revenueOrCapital: data.revenueOrCapital,
  agreementNumber: data.agreementNumber,
  year: data.year,
  paymentCurrency: data.currency,
  latestFullClaimAmount: getPoundValue(data.value),
  latestSitiPR: data.paymentRequestNumber,
  latestInDAXAmount: getPoundValue(data.daxValue),
  latestInDAXPR: data.daxPaymentRequestNumber,
  overallStatus: data.overallStatus,
  crossBorderFlag: data.crossBorderFlag,
  latestTransactionStatus: data.status,
  valueStillToProcess: getPoundValue(data.valueStillToProcess),
  PRsStillToProcess: data.prStillToProcess
})

module.exports = { mapClaimLevelData }
