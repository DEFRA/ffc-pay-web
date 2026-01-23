const generateSchemeYears = (data = null) => {
  const currentYear = new Date().getFullYear()
  let startYear = 2015

  if (data?.paymentsByScheme?.length) {
    const yearsFromData = data.paymentsByScheme
      .map(item => item.schemeYear)
      .filter(year => typeof year === 'number' && year > 0)
    if (yearsFromData.length > 0) {
      startYear = Math.min(...yearsFromData)
    }
  }

  const years = []
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year)
  }

  return years
}

module.exports = {
  generateSchemeYears
}
