const { sanitizeSchemes } = require('../../../app/helpers/sanitize-schemes')

describe('sanitizeSchemes', () => {
  test('should rename schemes according to nameMapping', () => {
    const inputSchemes = [
      { name: 'SFI', id: 1 },
      { name: 'Lump Sums', id: 2 },
      { name: 'Other Scheme', id: 4 },
      { name: 'COHT Capital', id: 5 }
    ]

    const expectedOutput = [
      { name: 'SFI-22', id: 1 },
      { name: 'Lump Sum Payments', id: 2 },
      { name: 'Other Scheme', id: 4 },
      { name: 'Countryside Stewardship Higher Tier (Capital)', id: 5 }
    ]

    const result = sanitizeSchemes(inputSchemes)

    expect(result).toEqual(expectedOutput)
  })

  test('should return empty array when given empty array', () => {
    expect(sanitizeSchemes([])).toEqual([])
  })

  test('should not mutate original input array', () => {
    const originalSchemes = [
      { name: 'SFI', id: 1 }
    ]
    const inputCopy = JSON.parse(JSON.stringify(originalSchemes))

    sanitizeSchemes(originalSchemes)

    expect(originalSchemes).toEqual(inputCopy)
  })

  test('should leave schemes unchanged if no mapping', () => {
    const inputSchemes = [
      { name: 'Unmapped Scheme', id: 10 },
      { name: 'Another Scheme', id: 11 }
    ]

    const result = sanitizeSchemes(inputSchemes)

    expect(result).toEqual(inputSchemes)
  })
})
