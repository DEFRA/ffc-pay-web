const addDetailsToFilename = (reportName, query) => {
  const {
    schemeId,
    year,
    prn,
    revenueOrCapital,
    frn,
    startDate,
    endDate
  } = query

  if (!reportName.endsWith('.csv')) {
    throw new Error('Filename must end with .csv')
  }

  const baseName = reportName.slice(0, -4) // remove ".csv"

  // For AP and AR reports
  if (startDate && endDate) {
    return `${baseName}_from_${startDate}_to_${endDate}.csv`
  }

  const parts = []

  if (schemeId) parts.push(`schemeId_${schemeId}`)
  if (year) parts.push(`year_${year}`)
  if (revenueOrCapital && revenueOrCapital.trim()) {
    parts.push(revenueOrCapital.trim())
  } else {
    parts.push('revenueOrCapital')
  }
  if (prn) parts.push(prn)
  if (frn) parts.push(`frn_${frn}`)

  const suffix = parts.length > 0 ? `_${parts.join('_')}` : ''

  return `${baseName}${suffix}.csv`
}

module.exports = {
  addDetailsToFilename
}
