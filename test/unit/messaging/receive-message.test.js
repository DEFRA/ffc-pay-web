const mockAcceptSession = jest.fn()
const mockReceiveMessages = jest.fn()
const mockCompleteMessage = jest.fn()
const mockCloseConnection = jest.fn()

const mockReceiver = {
  acceptSession: mockAcceptSession,
  receiveMessages: mockReceiveMessages,
  completeMessage: mockCompleteMessage,
  closeConnection: mockCloseConnection
}

const mockGetReceiver = jest.fn().mockReturnValue(mockReceiver)
const mockReceiveServiceBusMessage = jest.fn()

jest.mock('../../../app/messaging/service-bus', () => ({
  getReceiver: mockGetReceiver,
  receiveMessage: mockReceiveServiceBusMessage
}))

const { MESSAGE_ID } = require('../../mocks/messaging/message-id')
const { RESPONSE_MESSAGE } = require('../../mocks/messaging/message')

const { receiveMessage } = require('../../../app/messaging/receive-message')

let config

describe('receiveMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReceiveServiceBusMessage.mockReturnValue([RESPONSE_MESSAGE])
    config = {}
  })

  test('creates receiver and accepts session', async () => {
    await receiveMessage(MESSAGE_ID, config)
    expect(mockGetReceiver).toHaveBeenCalledWith(config)
    expect(mockAcceptSession).toHaveBeenCalledWith(MESSAGE_ID)
  })

  test('receives messages with correct parameters', async () => {
    await receiveMessage(MESSAGE_ID, config)
    expect(mockReceiveServiceBusMessage).toHaveBeenCalledWith(mockReceiver, 1, { maxWaitTimeInMs: 50000 })
  })

  test('completes message and closes connection when messages received', async () => {
    const result = await receiveMessage(MESSAGE_ID, config)
    expect(mockCompleteMessage).toHaveBeenCalledWith(RESPONSE_MESSAGE)
    expect(mockCloseConnection).toHaveBeenCalledTimes(1)
    expect(result).toEqual(RESPONSE_MESSAGE.body)
  })

  test('handles no messages gracefully', async () => {
    mockReceiveServiceBusMessage.mockReturnValue([])
    const result = await receiveMessage(MESSAGE_ID, config)
    expect(mockCompleteMessage).not.toHaveBeenCalled()
    expect(mockCloseConnection).toHaveBeenCalledTimes(1)
    expect(result).toBeUndefined()
  })
})
