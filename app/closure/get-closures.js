const moment = require('moment')
const { getProcessingData } = require('../api')

const getClosures = async () => {
  const { payload } = await getProcessingData('/closure')
  return payload.closures?.map(x => {
    x.closureDate = moment(x.closureDate).format('DD/MM/YYYY')
    if (x.schemeName === 'SFI') {
      x.schemeName = 'SFI22'
    }
    return x
  })
}

module.exports = {
  getClosures
}
