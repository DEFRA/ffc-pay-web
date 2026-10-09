const { sendMessage } = require('../../../../app/messaging/service-bus/send-message')
const messageSchema = require('../../../../app/messaging/service-bus/message-schema')

jest.mock('../../../../app/messaging/service-bus/message-schema', () => ({
  validateAsync: jest.fn()
}))

describe('sendMessage', () => {
  let sender

  beforeEach(() => {
    jest.clearAllMocks()
    sender = {
      sendMessages: jest.fn().mockResolvedValue()
    }
  })

  test('validates message, enriches it and sends it', async () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }
    messageSchema.validateAsync.mockResolvedValue()

    await sendMessage(sender, message)

    expect(messageSchema.validateAsync).toHaveBeenCalledWith(message, { allowUnknown: true })
    expect(sender.sendMessages).toHaveBeenCalledWith({
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service',
      applicationProperties: {
        type: 'uk.gov.demo.claim.validated',
        source: 'ffc-demo-claim-service'
      }
    }, undefined)
  })

  test('passes send options through', async () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }
    const options = { transactionId: 'abc' }
    messageSchema.validateAsync.mockResolvedValue()

    await sendMessage(sender, message, options)

    expect(sender.sendMessages).toHaveBeenCalledWith(expect.any(Object), options)
  })

  test('throws if validation fails', async () => {
    const message = { body: { claimId: 1 } }
    const validationError = new Error('type is required')
    messageSchema.validateAsync.mockRejectedValue(validationError)

    await expect(sendMessage(sender, message)).rejects.toThrow(validationError)
    expect(sender.sendMessages).not.toHaveBeenCalled()
  })
})
