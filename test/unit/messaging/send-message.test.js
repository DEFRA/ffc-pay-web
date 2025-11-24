const mockSendMessage = jest.fn()
const mockCloseConnection = jest.fn()

const mockMessageSender = jest.fn().mockImplementation(() => ({
  sendMessage: mockSendMessage,
  closeConnection: mockCloseConnection
}))

jest.mock('ffc-messaging', () => ({ MessageSender: mockMessageSender }))
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

  test.each([
    ['createMessage', () => sendMessage(BODY, TYPE, config, options), () => expect(mockCreateMessage).toHaveBeenCalledWith(BODY, TYPE, options)],
    ['MessageSender', () => sendMessage(BODY, TYPE, config, options), () => expect(mockMessageSender).toHaveBeenCalledWith(config)],
    ['sendMessage', () => sendMessage(BODY, TYPE, config, options), () => expect(mockSendMessage).toHaveBeenCalledWith(RESPONSE_MESSAGE)],
    ['closeConnection', () => sendMessage(BODY, TYPE, config, options), () => expect(mockCloseConnection).toHaveBeenCalled()]
  ])('should call %s correctly', async (_, sendMessage, expect) => {
    await sendMessage()
    expect()
  })
})
