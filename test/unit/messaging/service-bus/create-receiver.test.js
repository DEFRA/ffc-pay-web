const { createReceiver } = require('../../../../app/messaging/service-bus/create-receiver')

describe('createReceiver', () => {
  let sbClient

  beforeEach(() => {
    sbClient = {
      createReceiver: jest.fn().mockReturnValue({ name: 'receiver' })
    }
  })

  test('creates subscription receiver', () => {
    const config = {
      type: 'subscription',
      topic: 'my-topic',
      address: 'my-subscription'
    }

    createReceiver(sbClient, config)

    expect(sbClient.createReceiver).toHaveBeenCalledWith('my-topic', 'my-subscription')
  })

  test('creates queue receiver', () => {
    const config = {
      type: 'queue',
      address: 'my-queue'
    }

    createReceiver(sbClient, config)

    expect(sbClient.createReceiver).toHaveBeenCalledWith('my-queue')
  })

  test('throws for unsupported receiver type', () => {
    const config = {
      type: 'topic',
      address: 'my-topic'
    }

    expect(() => createReceiver(sbClient, config)).toThrow('Unsupported receiver type: topic')
  })
})
