const mockSendMessages = jest.fn()

const mockSender = {
  sendMessages: mockSendMessages
}

const mockGetSender = jest.fn().mockReturnValue(mockSender)
const mockSendServiceBusMessage = jest.fn()

jest.mock('../../../app/messaging/service-bus', () => ({
  getSender: mockGetSender,
  sendMessage: mockSendServiceBusMessage
}))
jest.mock('../../../app/messaging/create-message')
const { createMessage: mockCreateMessage } = require('../../../app/messaging/create-message')

const { TYPE } = require('../../../app/constants/type')
const { MESSAGE_ID } = require('../../mocks/messaging/message-id')
const { BODY } = require('../../mocks/messaging/body')
const { RESPONSE_MESSAGE } = require('../../mocks/messaging/message')

const { sendMessage } = require('../../../app/messaging/send-message')

describe('sendMessage', () => {
  let options
  let config

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMessage.mockReturnValue(RESPONSE_MESSAGE)
    options = { messageId: MESSAGE_ID }
    config = {}
  })

  test('creates sender and message', async () => {
    await sendMessage(BODY, TYPE, config, options)
    expect(mockGetSender).toHaveBeenCalledWith(config)
    expect(mockCreateMessage).toHaveBeenCalledWith(BODY, TYPE, options)
  })

  test('sends message via service bus', async () => {
    await sendMessage(BODY, TYPE, config, options)
    expect(mockSendServiceBusMessage).toHaveBeenCalledWith(mockSender, RESPONSE_MESSAGE)
  })
})
