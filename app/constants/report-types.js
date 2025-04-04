const getReportTypes = () => ({
  'Payment request statuses': 'payment-requests',
  'Payment request statuses v2': 'payment-requests-v2',
  'Combined transaction report': 'transaction-summary',
  'Suppressed payment requests': 'suppressed-payments',
  'AP-AR listing report': 'ap-ar-listing',
  Holds: 'holds',
  'Request Editor report': 'request-editor-report',
  'Claim level report': 'claim-level-report'
})

module.exports = {
  getReportTypes
}
