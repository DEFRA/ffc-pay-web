const parsedSchema = require('../routes/schemas/parsed-closure')

const sourceSystemIndex = 0
const frnIndex = 1
const agreementNumberIndex = 2
const closureDateIndex = 3
const maxClosureDataLength = 4

const processClosureData = async (data) => {
  const uploadData = []
  const splitData = data.split(/\r?\n|\r|\n/g)
  const closureLines = splitData.filter((str) => str !== '')
  for (const closureLine of closureLines) {
    const clData = closureLine.split(',')
    if (clData.length !== maxClosureDataLength) {
      return {
        errors: { details: [{ message: 'The file is not in the expected format' }] }
      }
    } else {
      const parsedData = {
        sourceSystem: clData[sourceSystemIndex],
        frn: clData[frnIndex],
        agreementNumber: clData[agreementNumberIndex],
        closureDate: clData[closureDateIndex]
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
