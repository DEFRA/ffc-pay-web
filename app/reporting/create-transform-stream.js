const { mapAndSanitize } = require('./mapping/map-and-sanitise')
const { Transform } = require('stream')

const MILLISECONDS_PER_SECOND = 1000
const MILLISECONDS_PER_MINUTE = 60000
const CSV_HIGH_WATER_MARK = 100

const createTransformStream = (fields, onComplete) => {
  let processedRowCount = 0
  const startTimestamp = Date.now()

  return new Transform({
    objectMode: true,
    highWaterMark: CSV_HIGH_WATER_MARK,

    transform (dataRow, _encoding, callback) {
      try {
        const transformedRow = mapAndSanitize(dataRow, fields)
        processedRowCount++
        callback(null, transformedRow)
      } catch (error) {
        callback(error)
      }
    },

    async flush (callback) {
      const elapsedTime = Date.now() - startTimestamp
      const minutes = Math.floor(elapsedTime / MILLISECONDS_PER_MINUTE)
      const seconds = ((elapsedTime % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND).toFixed(1)

      console.debug(`Finished processing ${processedRowCount} rows in ${minutes}m ${seconds}s`)
      await onComplete()
      callback()
    }
  })
}

module.exports = { createTransformStream }
