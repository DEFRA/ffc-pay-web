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
    return {
      scheme,
      radios: radioButtonMapper(categoriesForScheme, options)
    }
  })
}

module.exports = { mapHoldCategoriesToRadios }
