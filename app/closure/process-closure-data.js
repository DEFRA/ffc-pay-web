const parsedSchema = require('../routes/schemas/parsed-closure')

const maxClosureDataLength = 3
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
        frn: clData[0],
        agreementNumber: clData[1],
        closureDate: clData[2]
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
