const { getDataRequestFile } = require('../storage')
const { getDataFields } = require('./mapping')
const { createTransformStream } = require('./create-transform-stream')
const JSONStream = require('JSONStream')
const { format } = require('@fast-csv/format')

const generateReport = async (filename, reportType, onComplete) => {
  try {
    const fileData = await getDataRequestFile(filename)

    if (!fileData.readableStreamBody) {
      console.warn(`No data available for report type: ${reportType} with filename: ${filename}`)
      return null
    }

    const csvFields = getDataFields(reportType)
    const csvStream = format({ headers: true })

    return fileData.readableStreamBody
      .pipe(JSONStream.parse('*'))
      .pipe(createTransformStream(csvFields, onComplete))
      .pipe(csvStream)
  } catch (error) {
    console.error(`Error generating report for ${reportType} with filename ${filename}:`, error)
    onComplete(true, error.message)
    throw error
  }
}

module.exports = {
  generateReport
}
