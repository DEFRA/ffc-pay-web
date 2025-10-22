const { radioButtonMapper } = require('../../../app/helpers/radio-button-mapper')

describe('radioButtonMapper', () => {
  test('maps an array of items using default keys', () => {
    const items = [
      { value: '1', text: 'option one' },
      { value: '2', text: 'option two' }
    ]

    const result = radioButtonMapper(items)

    expect(result).toEqual([
      { id: 'Option one_id', value: '1', text: 'Option one' },
      { id: 'Option two_id', value: '2', text: 'Option two' }
    ])
  })

  test('respects custom valueKey and textKey options', () => {
    const items = [
      { key: 'abc', label: 'custom label' }
    ]

    const result = radioButtonMapper(items, { valueKey: 'key', textKey: 'label' })

    expect(result).toEqual([
      { id: 'Custom label_id', value: 'abc', text: 'Custom label' }
    ])
  })

  test('returns empty value and text when keys are missing', () => {
    const items = [{}]

    const result = radioButtonMapper(items)

    expect(result).toEqual([
      { id: '_id', value: '', text: '' }
    ])
  })

  test('throws a TypeError if input is not an array', () => {
    expect(() => radioButtonMapper('not an array')).toThrow(TypeError)
    expect(() => radioButtonMapper('not an array')).toThrow('radioButtonMapper expects an array of items')
  })

  test('skips capitalization when capitalize option is false', () => {
    const items = [{ value: '1', text: 'lowercase text' }]

    const result = radioButtonMapper(items, { capitalize: false })

    expect(result).toEqual([
      { id: 'lowercase text_id', value: '1', text: 'lowercase text' }
    ])
  })

  test('handles already capitalized or mixed-case text correctly', () => {
    const items = [
      { value: '1', text: 'ALREADY UPPER' },
      { value: '2', text: 'MiXeD cAsE' }
    ]

    const result = radioButtonMapper(items)

    expect(result).toEqual([
      { id: 'Already upper_id', value: '1', text: 'Already upper' },
      { id: 'Mixed case_id', value: '2', text: 'Mixed case' }
    ])
  })

  test('returns empty array when given no items', () => {
    expect(radioButtonMapper([])).toEqual([])
  })
})
