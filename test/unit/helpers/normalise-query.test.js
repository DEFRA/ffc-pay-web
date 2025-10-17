const { normaliseQuery } = require('../../../app/helpers/normalise-query')

jest.mock('../../../app/helpers/date-time-formatter', () => ({
  formatDateFromParts: (day, month, year) => {
    if (day && month && year) {
      const pad = (n) => n.toString().padStart(2, '0')
      return `${year}-${pad(month)}-${pad(day)}`
    }
    return undefined
  }
}))

const DEFAULT_START_DATE = '2015-01-01'

describe('normaliseQuery', () => {
  test('should set startDate and endDate when schemeId is absent (AP-AR report) with complete valid date parts', () => {
    const query = {
      'select-type': 'summary',
      'start-date-day': '1',
      'start-date-month': '2',
      'start-date-year': '2020',
      'end-date-day': '28',
      'end-date-month': '2',
      'end-date-year': '2020',
      prn: 'PRN001',
      frn: 'FRN001',
      revenueOrCapital: 'revenue'
    }
    const result = normaliseQuery(query)
    expect(result.reportType).toBe('summary')
    expect(result.schemeId).toBeUndefined()
    expect(result.prn).toBe('PRN001')
    expect(result.frn).toBe('FRN001')
    expect(result.revenueOrCapital).toBe('revenue')
    expect(result.startDate).toBe('2020-02-01')
    expect(result.endDate).toBe('2020-02-28')
  })

  test('should set startDate and endDate when schemeId is present and all date parts provided (valid date range)', () => {
    const query = {
      'select-type': 'detailed',
      'start-date-day': '5',
      'start-date-month': '6',
      'start-date-year': '2019',
      'end-date-day': '15',
      'end-date-month': '6',
      'end-date-year': '2019',
      schemeId: 'S123',
      year: '2019',
      prn: 'PRN002',
      frn: 'FRN002',
      revenueOrCapital: 'capital'
    }
    const result = normaliseQuery(query)
    expect(result.schemeId).toBe('S123')
    expect(result.startDate).toBe('2019-06-05')
    expect(result.endDate).toBe('2019-06-15')
    expect(result.reportType).toBe('detailed')
    expect(result.year).toBe('2019')
  })

  test('should leave startDate and endDate as null when schemeId is present and date parts are incomplete', () => {
    const query = {
      'select-type': 'detailed',
      'start-date-month': '6',
      'start-date-year': '2019',
      'end-date-day': '15',
      'end-date-month': '6',
      schemeId: 'S123',
      year: '2019',
      prn: 'PRN003',
      frn: 'FRN003',
      revenueOrCapital: 'capital'
    }
    const result = normaliseQuery(query)
    expect(result.schemeId).toBe('S123')
    expect(result.startDate).toBeNull()
    expect(result.endDate).toBeNull()
  })

  test('should use defaults when date parts are not valid even if schemeId is absent', () => {
    const fixedDate = new Date('2021-08-20T00:00:00Z')
    const RealDate = Date
    global.Date = class extends RealDate {
      constructor (...args) {
        if (args.length) {
          return new RealDate(...args)
        }
        return fixedDate
      }

      static now () {
        return fixedDate.getTime()
      }
    }

    const query = {
      'select-type': 'overview',
      'start-date-day': '',
      'start-date-month': '',
      'start-date-year': '',
      'end-date-day': '20',
      'end-date-month': '8',
      'end-date-year': '2021',
      prn: 'PRN004',
      frn: 'FRN004',
      revenueOrCapital: 'revenue'
    }
    const result = normaliseQuery(query)
    expect(result.startDate).toBe(DEFAULT_START_DATE)
    expect(result.endDate).toBe('2021-08-20')

    // Restore Date global
    global.Date = RealDate
  })

  test('should forward other properties unchanged', () => {
    const query = {
      'select-type': 'test',
      schemeId: 'S999',
      year: '2022',
      prn: 'PRN005',
      frn: 'FRN005',
      revenueOrCapital: 'capital'
    }
    const result = normaliseQuery(query)
    expect(result.reportType).toBe('test')
    expect(result.schemeId).toBe('S999')
    expect(result.year).toBe('2022')
    expect(result.prn).toBe('PRN005')
    expect(result.frn).toBe('FRN005')
    expect(result.revenueOrCapital).toBe('capital')
    expect(result.startDate).toBeNull()
    expect(result.endDate).toBeNull()
  })
})
