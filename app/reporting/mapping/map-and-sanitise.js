const { getPoundValue } = require('../../helpers/get-pound-value')
const { convertDateToDDMMYYYY } = require('../../helpers/convert-date-to-ddmmyyyy')

const VALUE_FIELDS = ['deltaAmount', 'value', 'daxValue', 'valueStillToProcess', 'apValue', 'arValue', 'settledValue']
const DATE_FIELDS = ['receivedInRequestEditor', 'releasedFromRequestEditor', 'batchExportDate', 'lastUpdated']

const sanitizeField = (key, value) => {
  if (VALUE_FIELDS.includes(key)) {
    return getPoundValue(value)
  }
  if (DATE_FIELDS.includes(key)) {
    return convertDateToDDMMYYYY(value)
  }
  return value
}

const mapAndSanitize = (data, fieldMap) => {
  const result = {}

  for (const [label, path] of Object.entries(fieldMap)) {
    const rawValue = path.split('.').reduce((obj, p) => obj?.[p], data)
    result[label] = sanitizeField(path.split('.').slice(-1)[0], rawValue)
  }

  return result
}

module.exports = { mapAndSanitize }
