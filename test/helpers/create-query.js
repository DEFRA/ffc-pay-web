const createQuery = (overrides = {}) => {
  return {
    'select-type': 'summary',
    'start-date-day': '1',
    'start-date-month': '1',
    'start-date-year': '2020',
    'end-date-day': '31',
    'end-date-month': '1',
    'end-date-year': '2020',
    schemeId: undefined,
    year: undefined,
    prn: 'PRN_DEFAULT',
    frn: 'FRN_DEFAULT',
    revenueOrCapital: 'revenue',
    ...overrides
  }
}

module.exports = { createQuery }
