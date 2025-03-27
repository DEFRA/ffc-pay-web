const { convertDateToDDMMYYYY } = require('./convert-date-to-ddmmyyyy')
const { getPoundValue } = require('./get-pound-value')

const sanitizeData = (dataArray) => {
  return dataArray.map(data => {
    const valueFields = ['deltaAmount', 'value', 'daxValue', 'valueStillToProcess', 'apValue', 'arValue']
    const dateFields = ['receivedInRequestEditor', 'releasedFromRequestEditor', 'batchExportDate', 'lastUpdated']

    valueFields.forEach(field => {
      if (data[field] !== undefined) {
        data[field] = getPoundValue(data[field])
      }
    })

    dateFields.forEach(field => {
      if (data[field] !== undefined) {
        data[field] = convertDateToDDMMYYYY(data[field])
      }
    })

    return data
  })
}

module.exports = {
  sanitizeData
}
