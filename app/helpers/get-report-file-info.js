const getReportFileInfo = () => {
  return {
    'Payment Holds': {
      fileType: '(CSV)',
      size: 'Variable'
    },
    'Request Editor report': {
      fileType: '(CSV)',
      size: 'Variable'
    },
    'Suppressed payment requests': {
      fileType: '(CSV)',
      size: 'Variable'
    }
  }
}

module.exports = { getReportFileInfo }
