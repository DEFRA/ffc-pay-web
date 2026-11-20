const moment = require('moment')
const parsedSchema = require('../routes/schemas/closure/parsed-closure')

const sourceSystemIndex = 0
const frnIndex = 1
const agreementNumberIndex = 2
const closureDateIndex = 3
const maxClosureDataLength = 4

const BYTE_ORDER_MARK = /^\uFEFF/

const OUTPUT_DATE_FORMAT = 'YYYY-MM-DD'
const ACCEPTED_DATE_FORMATS = [
  OUTPUT_DATE_FORMAT,
  'YYYY/MM/DD',
  'D/M/YYYY',
  'DD/MM/YYYY',
  'D-M-YYYY',
  'DD-MM-YYYY'
]

const normaliseClosureDate = (closureDate) => {
  const parsedDate = moment(closureDate, ACCEPTED_DATE_FORMATS, true)
  return parsedDate.isValid() ? parsedDate.format(OUTPUT_DATE_FORMAT) : closureDate
}

const processClosureData = async (data) => {
  const uploadData = []
  const splitData = data.replace(BYTE_ORDER_MARK, '').split(/\r?\n|\r|\n/g)
  const closureLines = splitData.filter((str) => str.trim() !== '')
  for (const closureLine of closureLines) {
    const clData = closureLine.split(',').map(value => value.trim())
    if (clData.length !== maxClosureDataLength) {
      return {
        errors: { details: [{ message: 'The file is not in the expected format' }] }
      }
    } else {
      const parsedData = {
        sourceSystem: clData[sourceSystemIndex],
        frn: clData[frnIndex],
        agreementNumber: clData[agreementNumberIndex],
        closureDate: normaliseClosureDate(clData[closureDateIndex])
      }
      const result = parsedSchema.validate(parsedData, {
        abortEarly: false
      })
      if (result.error) {
        return {
          errors: result.error
        }
      } else {
        uploadData.push(parsedData)
      }
    }
  }
  return {
    uploadData
  }
}

module.exports = {
  processClosureData
}
