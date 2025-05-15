const zero = 0
const negative4 = -4

const addDetailsToFilename = (reportName, query) => {
  if (!reportName.endsWith('.csv')) {
    throw new Error('Filename must end with .csv')
  }

  const baseName = reportName.slice(zero, negative4) // removes .csv
  const { schemeId, year, prn, revenueOrCapital, frn, startDate, endDate } = query

  if (startDate && endDate) {
    return `${baseName}_from_${startDate}_to_${endDate}.csv`
  }

  const parts = [
    schemeId && `schemeId_${schemeId}`,
    year && `year_${year}`,
    formatRevenueOrCapital(revenueOrCapital),
    prn || null,
    frn && `frn_${frn}`
  ].filter(Boolean)

  const suffix = parts.length ? `_${parts.join('_')}` : ''
  return `${baseName}${suffix}.csv`
}

const formatRevenueOrCapital = (value) => {
  return value && value.trim() ? value.trim() : 'revenueOrCapital'
}

module.exports = {
  addDetailsToFilename
}
