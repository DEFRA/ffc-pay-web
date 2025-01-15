jest.mock('uuid')
const { v4: mockUuid } = require('uuid')

jest.mock('../../../app/messaging')
const {
  sendMessage: mockSendMessage,
  receiveMessage: mockReceiveMessage
} = require('../../../app/messaging')

const { TYPE } = require('../../../app/constants/type')

const { RESPONSE } = require('../../mocks/response')
const { MESSAGE_ID } = require('../../mocks/messaging/message-id')
const { VALUE } = require('../../mocks/values/value')
const { CATEGORY } = require('../../mocks/values/category')
const { DATA } = require('../../mocks/values/data')

const { getData } = require('../../../app/payments/get-data')

describe('get data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUuid.mockReturnValue(MESSAGE_ID)
    mockReceiveMessage.mockResolvedValue(RESPONSE)
  })

  test('should send message with category and value', async () => {
    await getData(CATEGORY, VALUE)
    expect(mockSendMessage.mock.calls[0][0]).toMatchObject({
      category: CATEGORY,
      value: VALUE
    })
  })

  test('should send message with type', async () => {
    await getData(CATEGORY, VALUE)
    expect(mockSendMessage.mock.calls[0][1]).toBe(TYPE)
  })

  test('should send message with new unique identifier as message id', async () => {
    await getData(CATEGORY, VALUE)
    expect(mockSendMessage.mock.calls[0][3].messageId).toBe(MESSAGE_ID)
  })

  test('should receive message with message id', async () => {
    await getData(CATEGORY, VALUE)
    expect(mockReceiveMessage.mock.calls[0][0]).toBe(MESSAGE_ID)
  })

  test('should return response data if response received', async () => {
    const result = await getData(CATEGORY, VALUE)
    expect(result).toBe(DATA)
  })

  test('should return null if no response received', async () => {
    mockReceiveMessage.mockResolvedValue(null)
    const result = await getData(CATEGORY, VALUE)
    expect(result).toBe(null)
  })

  test('should change scheme from SFI to SFI22 in response data', async () => {
    const responseMock = {
      data: [{ scheme: 'SFI' }, { scheme: 'OTHER' }, { scheme: 'SFI' }]
    }
    mockReceiveMessage.mockResolvedValue(responseMock)

    const result = await getData(CATEGORY, VALUE)

    expect(result).toEqual([
      { scheme: 'SFI22' },
      { scheme: 'OTHER' },
      { scheme: 'SFI22' }
    ])
  })
})
