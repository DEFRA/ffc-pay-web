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

const { getData } = require('../../../app/payments/get-data')
const { getDataRequestFile } = require('../../../app/storage')
jest.mock('../../../app/storage')

describe('get data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUuid.mockReturnValue(MESSAGE_ID)
    mockReceiveMessage.mockResolvedValue(RESPONSE)
    getDataRequestFile.mockResolvedValue({
      readableStreamBody: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('{"data": "mockData"}'))
          }
          if (event === 'end') {
            callback()
          }
        })
      }
    })
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

  test('should return null if no response received', async () => {
    mockReceiveMessage.mockResolvedValue(null)
    const result = await getData(CATEGORY, VALUE)
    expect(result).toBe(null)
  })

  test('should change scheme from SFI to SFI22 in response data', async () => {
    getDataRequestFile.mockResolvedValue({
      readableStreamBody: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('{"data": [{"scheme": "SFI"}, {"scheme": "OTHER"}, {"scheme": "SFI"}]}'))
          }
          if (event === 'end') {
            callback()
          }
        })
      }
    })

    const result = await getData(CATEGORY, VALUE)

    expect(result).toEqual([
      { scheme: 'SFI22' },
      { scheme: 'OTHER' },
      { scheme: 'SFI22' }
    ])
  })

  test('should log and return null if no data is available', async () => {
    getDataRequestFile.mockResolvedValue({
      readableStreamBody: {
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            callback()
          }
        })
      }
    })
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const result = await getData(CATEGORY, VALUE)
    expect(consoleLogSpy).toHaveBeenCalledWith('No data available for the supplied category and value')
    expect(result).toBe(null)
    consoleLogSpy.mockRestore()
  })

  test('should log data response received', async () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await getData(CATEGORY, VALUE)
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      'Data response received:',
      expect.anything()
    )
    consoleInfoSpy.mockRestore()
  })

  test('should return parsed data if it is not an array', async () => {
    getDataRequestFile.mockResolvedValue({
      readableStreamBody: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('{"data": {"someKey": "someValue"}}'))
          }
          if (event === 'end') {
            callback()
          }
        })
      }
    })

    const result = await getData(CATEGORY, VALUE)
    expect(result).toEqual({ someKey: 'someValue' })
  })
})
