const { getDataRequestFile } = require('../storage')
const { getDataMapper } = require('./mapping')
const JSONStream = require('JSONStream')
const { format } = require('@fast-csv/format')
const { Transform } = require('stream')

const DEFAULT_HIGH_WATER_MARK = 100

const generateReport = async (filename, reportType) => {
  const file = await getDataRequestFile(filename)
  if (!file || !file.readableStreamBody) {
    console.warn(`No data available for report type: ${reportType} with filename: ${filename}`)
    return null
  }

  const mapper = getDataMapper(reportType)
  const csvStream = format({ headers: true })

  return file.readableStreamBody
    .pipe(JSONStream.parse('*'))
    .pipe(createMappingTransform(mapper))
    .pipe(csvStream)
}

const createMappingTransform = (mapper) => {
  let rowCount = 0
  const startTime = Date.now()

  return new Transform({
    objectMode: true,
    highWaterMark: DEFAULT_HIGH_WATER_MARK,
    transform (chunk, _enc, callback) {
      try {
        const mapped = mapper(chunk)
        rowCount++
        callback(null, mapped)
      } catch (err) {
        callback(err)
      }
    },
    flush (callback) {
      const duration = Date.now() - startTime
      const minutes = Math.floor(duration / 60000)
      const seconds = ((duration % 60000) / 1000).toFixed(1)
      console.debug(`Finished processing ${rowCount} rows in ${minutes}m ${seconds}s`)
      callback()
    }
  })
}

module.exports = {
  generateReport
}
