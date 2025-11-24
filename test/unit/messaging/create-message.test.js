const { TYPE } = require('../../../app/constants/type')
const { SOURCE } = require('../../../app/constants/source')

const { BODY } = require('../../mocks/messaging/body')
const { MESSAGE_ID } = require('../../mocks/messaging/message-id')

const { createMessage } = require('../../../app/messaging/create-message')

describe('createMessage', () => {
  const baseMessage = createMessage(BODY, TYPE)

  test.each([
    ['body', baseMessage.body, BODY],
    ['type', baseMessage.type, TYPE],
    ['source', baseMessage.source, SOURCE]
  ])('should set %s correctly', (_, actual, expected) => {
    expect(actual).toEqual(expected)
  })

  test('should apply optional fields', () => {
    const options = { messageId: MESSAGE_ID }
    const messageWithOptions = createMessage(BODY, TYPE, options)
    expect(messageWithOptions.messageId).toEqual(MESSAGE_ID)
  })
})
