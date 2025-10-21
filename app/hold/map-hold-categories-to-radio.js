const { radioButtonMapper } = require('../helpers/radio-button-mapper')

const mapHoldCategoriesToRadios = (schemes, categories, options = {}) => {
  const grouped = categories.reduce((acc, category) => {
    if (!acc[category.schemeId]) acc[category.schemeId] = []
    acc[category.schemeId].push(category)
    return acc
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
