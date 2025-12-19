const generateSchemeYears = () => {
  const currentYear = new Date().getFullYear()
  const startYear = 2023
  const years = []
  
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year)
  }
  
  return years
}

module.exports = {
  generateSchemeYears
}