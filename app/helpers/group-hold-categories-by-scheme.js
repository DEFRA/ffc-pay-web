const groupHoldCategoriesByScheme = (paymentHoldCategories) => {
  const map = paymentHoldCategories.reduce((acc, c) => {
    const key = c.schemeId
    if (!acc.has(key)) {
      acc.set(key, {
        schemeId: c.schemeId,
        schemeName: c.schemeName,
        holdCategories: []
      })
    }
    acc.get(key).holdCategories.push({
      holdCategoryId: c.holdCategoryId,
      holdCategoryName: c.name
    })
    return acc
  }, new Map())

  return Array.from(map.values()).sort((a, b) => Number(a.schemeId) - Number(b.schemeId))
}

module.exports = {
  groupHoldCategoriesByScheme
}
