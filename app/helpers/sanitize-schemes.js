const sanitizeSchemes = (schemes) => {
  const nameMapping = {
    SFI: 'SFI 22',
    'Vet Visits': 'Annual Health and Welfare Review'
  }

  return schemes
    .map(scheme => {
      if (Object.hasOwn(nameMapping, scheme.name)) {
        return { ...scheme, name: nameMapping[scheme.name] }
      }
      return scheme
    })
}

module.exports = {
  sanitizeSchemes
}
