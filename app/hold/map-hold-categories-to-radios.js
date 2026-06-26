const { radioButtonMapper } = require('../helpers/radio-button-mapper')

const mapHoldCategoriesToRadios = (schemes, categories, options = {}) => {
  const grouped = categories.reduce((accumulator, category) => {
    if (!accumulator[category.schemeId]) {
      accumulator[category.schemeId] = []
    }

    accumulator[category.schemeId].push(category)

    return accumulator
  }, {})

  return schemes.map(scheme => {
    const categoriesForScheme = grouped[scheme.id] || []
    const idMapping = { ...options, schemeId: scheme.id }
    return {
      scheme,
      radios: radioButtonMapper(categoriesForScheme, idMapping)
    }
  })
}

module.exports = { mapHoldCategoriesToRadios }
