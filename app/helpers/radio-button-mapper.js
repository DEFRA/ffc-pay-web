const radioButtonMapper = (items = [], options = {}) => {
  const {
    valueKey = 'value',
    textKey = 'text',
    capitalize = true,
    schemeId
  } = options

  if (!Array.isArray(items)) {
    throw new TypeError('radioButtonMapper expects an array of items')
  }

  return items.map(item => {
    const value = item[valueKey] ?? ''
    let text = item[textKey] ?? ''

    if (typeof text === 'string' && capitalize) {
      text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    }

    const idPrefix = schemeId ? `${schemeId}_` : ''

    return {
      id: `${idPrefix}${text}_id`,
      value,
      text
    }
  })
}

module.exports = { radioButtonMapper }
