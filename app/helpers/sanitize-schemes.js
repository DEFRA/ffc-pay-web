const sanitizeSchemes = (schemes) => {
  const nameMapping = {
    SFI: 'SFI-22',
    'SFI Pilot': 'SFI-Pilot',
    'Lump Sums': 'Lump Sum Payments',
    CS: 'Countryside Stewardship',
    BPS: 'Basic Payment Scheme',
    'Manual Invoice': 'Manual Injection',
    ES: 'Environmental Stewardship',
    FC: 'Forestry Commission',
    SFI23: 'SFI-23',
    Delinked: 'Delinked Payments',
    'COHT Revenue': 'Countryside Stewardship Higher Tier (Revenue)',
    'COHT Capital': 'Countryside Stewardship Higher Tier (Capital)'
  }

  return schemes
    .filter(scheme => scheme.name !== 'FDMR')
    .map(scheme => {
      if (Object.prototype.hasOwnProperty.call(nameMapping, scheme.name)) {
        return { ...scheme, name: nameMapping[scheme.name] }
      }
      return scheme
    })
}

module.exports = {
  sanitizeSchemes
}
