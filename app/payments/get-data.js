const { v4: uuidv4 } = require('uuid')
const util = require('util')
const { TYPE } = require('../constants/type')
const config = require('../config')
const { sendMessage, receiveMessage } = require('../messaging')

const getData = async (category, value) => {
  const messageId = uuidv4()
  const request = { category, value }

  await sendMessage(request, TYPE, config.messageConfig.dataTopic, {
    messageId
  })
  console.info('Data request sent:', util.inspect(request, false, null, true))

  const response = await receiveMessage(
    messageId,
    config.messageConfig.dataQueue
  )

  if (!response) {
    return null
  }

  console.info(
    'Data response received:',
    util.inspect(response, false, null, true)
  )

  if (!Array.isArray(response.data)) {
    return response.data
  }

  const transformedData = response.data.map(item => ({
    ...item,
    scheme: item.scheme === 'SFI' ? 'SFI22' : item.scheme
  }))

  return transformedData
}

module.exports = {
  getData
}
