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
  return Array.from(map.values()).map(group => {
    group.holdCategories.sort((a, b) =>
      a.holdCategoryName.localeCompare(b.holdCategoryName)
    )
    return group
  })
    .sort((a, b) => a.schemeName.localeCompare(b.schemeName))
}

module.exports = {
  groupHoldCategoriesByScheme
}
