const api = require('../api')
const { getDataRequestFile } = require('../storage')

const { getDataMapper } = require('./mapping')

const JSONStream = require('JSONStream')

const { format } = require('@fast-csv/format')
const { Transform } = require('stream')

const getReportData = async (url) => await queryTrackingApi(url)

const generateReport = async (jsonLocation) => {
  const jsonFile = await downloadTrackingData(jsonLocation)
  console.log(jsonLocation)
  // set to ready once JSON
  const csvStream = format({ headers: true })

  // Stream the CSV file directly to the user.
  const responseStream = jsonFile.readableStreamBody
    .pipe(JSONStream.parse('*'))
    .pipe(mapTransform(jsonLocation))
    .pipe(csvStream)

  return responseStream
}

const queryTrackingApi = async (url) => {
  console.log(`Downloading report data from ${url}`)

  const response = await api.getTrackingData(url)

  console.log('Tracking response received', response.payload)

  return response.payload.file
}

const downloadTrackingData = async (reportLocation) => {
  const jsonFile = await getDataRequestFile(reportLocation)

  if (!jsonFile) {
    console.log('No data available for the supplied category and value')
    return null
  }
  return jsonFile
}

const mapTransform = (filename) => {
  const reportMatch = filename.match(/^ffc-pay-(.*?)-from/)
  const reportName = reportMatch ? reportMatch[1] : '' // if null will just do ap data.
  console.log(reportName)
  const mapper = getDataMapper(reportName)

  let rowCount = 0
  const start = Date.now()

  return new Transform({
    objectMode: true,
    highWaterMark: 100,
    transform (chunk, _encoding, callback) {
      try {
        const mapped = mapper(chunk)
        rowCount++
        callback(null, mapped)
      } catch (err) {
        callback(err)
      }
    },
    flush (callback) {
      const duration = Date.now() - start

      const minutes = Math.floor(duration / 60000)
      const seconds = ((duration % 60000) / 1000).toFixed(1)

      console.debug(`Finished processing ${rowCount} rows for report: ${reportName} in ${minutes}m ${seconds}s`)
      callback()
    }
  })
}

module.exports = { generateReport, getReportData }
