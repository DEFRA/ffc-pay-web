const { enrichMessage } = require('../../../../app/messaging/service-bus/enrich-message')

describe('enrichMessage', () => {
  test('maps type and source into applicationProperties', () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }

    const enriched = enrichMessage(message)

    expect(enriched.applicationProperties).toEqual({
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    })
  })

  test('spreads metadata into applicationProperties', () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service',
      metadata: {
        customField: 'custom-value'
      }
    }

    const enriched = enrichMessage(message)

    expect(enriched.applicationProperties).toEqual({
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service',
      customField: 'custom-value'
    })
  })

  test('preserves existing message properties', () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service',
      subject: 'New Claim'
    }

    const enriched = enrichMessage(message)

    expect(enriched.body).toEqual({ claimId: 1 })
    expect(enriched.type).toBe('uk.gov.demo.claim.validated')
    expect(enriched.source).toBe('ffc-demo-claim-service')
    expect(enriched.subject).toBe('New Claim')
  })
})
