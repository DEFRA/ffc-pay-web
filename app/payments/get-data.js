const { v4: uuidv4 } = require('uuid')
const util = require('util')
const { TYPE } = require('../constants/type')
const config = require('../config')
const { sendMessage, receiveMessage } = require('../messaging')
const { getDataRequestFile } = require('../storage')

const streamToString = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data.toString())
    })
    readableStream.on('end', () => {
      resolve(chunks.join(''))
    })
    readableStream.on('error', reject)
  })
}

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
    `Data response received saved at uri: ${response.uri}`
  )

  const file = await getDataRequestFile(response.uri.split('/').pop())
  const downloadedData = await streamToString(file.readableStreamBody)

  if (!downloadedData) {
    console.log('No data available for the supplied category and value')
    return null
  }

  const parsedData = JSON.parse(downloadedData)

  console.info(
    'Data response received:',
    util.inspect(parsedData, false, null, true)
  )

  if (!Array.isArray(parsedData.data)) {
    return parsedData.data
  }

  const transformedData = parsedData.data.map(item => ({
    ...item,
    scheme: item.scheme === 'SFI' ? 'SFI22' : item.scheme
  }))
  console.log(transformedData)
  return transformedData
}

module.exports = {
  getData
}
