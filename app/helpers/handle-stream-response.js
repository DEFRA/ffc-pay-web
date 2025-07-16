const { readableStreamReturn } = require('./readable-stream-return')

const handleStreamResponse = async (getReport, reportName, h) => {
  try {
    const response = await getReport()

    if (response) {
      return readableStreamReturn(response, h, reportName)
    }
    return h.view('payment-report-unavailable')
  } catch (error) {
    console.error('Error handling stream response:', error)
    return h.view('payment-report-unavailable')
  }
}

module.exports = {
  handleStreamResponse
}
