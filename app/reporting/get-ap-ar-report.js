const api = require('../api')
const { getDataRequestFile, saveReportFile } = require('../storage')

const { getDataMapper } = require('./mapping')
const { getBaseFilename } = require('../helpers/get-base-filename')

const JSONStream = require('JSONStream')

const { format } = require('@fast-csv/format')
const { Transform } = require('stream')

const queryTrackingApi = async (url) => {
  console.log(`Downloading report data from ${url}`)

  const response = await api.getTrackingData(url)

  console.log('Tracking response received', response.payload)

  return response.payload.file
}

const downloadTrackingData = async (url) => {
  const reportLocation = await queryTrackingApi(url)

  const jsonFile = await getDataRequestFile(reportLocation)
  if (!jsonFile) {
    console.log('No data available for the supplied category and value')
    return null
  }
  return jsonFile
}

const generateReport = async (reportName, reportDataUrl, startDate, endDate) => {
  const url = `${reportDataUrl}?startDate=${startDate}&endDate=${endDate}`

  const jsonFile = downloadTrackingData(url)
  const csvStream = format({ headers: true })

  // Stream the CSV file directly to the user.
  const responseStream = jsonFile.readableStreamBody
    .pipe(JSONStream.parse('*'))
    .pipe(mapTransform(reportName))
    .pipe(csvStream)

  // ? use stream to save directly to Azure BLOB storage
  const filename = `${getBaseFilename(reportName)}-from-${startDate}-to-${endDate}.csv`

  await saveReportFile(filename, responseStream)
}

const mapTransform = (reportName) => {
  const mapper = getDataMapper(reportName)

  return new Transform({
    objectMode: true,
    transform (chunk, _encoding, callback) {
      try {
        const mapped = mapper(chunk)
        callback(null, mapped)
      } catch (err) {
        callback(err)
      }
    }
  })
}

module.exports = { generateReport }
