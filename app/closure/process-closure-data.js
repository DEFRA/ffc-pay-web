const parsedSchema = require('../routes/schemas/parsed-closure')

const processClosureData = async (data) => {
  const uploadData = []
  const splitData = data.split(/\r?\n|\r|\n/g)
  const closureLines = splitData.filter((str) => str !== '')
  for (let i = 0; i < closureLines.length; i++) {
    const closure = closureLines[i]
    const clData = closure.split(',')
    if (clData.length !== 3) {
      return {
        errors: { details: [{ message: 'The file is not in the expected format' }] }
      }
    } else {
      const parsedData = {
        frn: clData[0],
        agreementNumber: clData[1],
        closureDate: clData[2]
      }
      console.log(parsedData.closureDate)
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
