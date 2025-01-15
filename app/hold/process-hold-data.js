const parsedSchema = require('../routes/schemas/parsed-hold')

const processHoldData = async (data) => {
  const uploadData = []
  const splitData = data.split(',')
  for (const frn of splitData) {
    const result = parsedSchema.validate({ frn }, {
      abortEarly: false
    })
    if (result.error) {
      return {
        errors: result.error
      }
    } else {
      uploadData.push(frn)
    }
  }
  return {
    uploadData
  }
}

module.exports = {
  processHoldData
}
