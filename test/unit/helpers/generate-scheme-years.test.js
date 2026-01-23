const { generateSchemeYears } = require('../../../app/helpers/generate-scheme-years')

describe('generateSchemeYears', () => {
  const RealDate = Date

  beforeAll(() => {
    global.Date = class extends RealDate {
      constructor () {
        super()
        return new RealDate('2026-01-23T00:00:00Z')
      }

      static now () {
        return new RealDate('2026-01-23T00:00:00Z').getTime()
      }

      static getFullYear () {
        return 2026
      }
    }
  })

  afterAll(() => {
    global.Date = RealDate
  })

  test('should return years from current year to 2015 when no data is provided', () => {
    const result = generateSchemeYears()
    expect(result).toEqual(expect.arrayContaining([2026, 2015]))
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2015)
    expect(result.length).toBe(12)
  })

  test('should return years from current year to 2015 when data is null', () => {
    const result = generateSchemeYears(null)
    expect(result).toEqual(expect.arrayContaining([2026, 2015]))
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2015)
    expect(result.length).toBe(12)
  })

  test('should return years from current year to 2015 when paymentsByScheme is missing', () => {
    const result = generateSchemeYears({})
    expect(result).toEqual(expect.arrayContaining([2026, 2015]))
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2015)
    expect(result.length).toBe(12)
  })

  test('should return years from current year to 2015 when paymentsByScheme is empty', () => {
    const result = generateSchemeYears({ paymentsByScheme: [] })
    expect(result).toEqual(expect.arrayContaining([2026, 2015]))
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2015)
    expect(result.length).toBe(12)
  })

  test('should return years from current year to minimum valid schemeYear', () => {
    const result = generateSchemeYears({
      paymentsByScheme: [
        { schemeYear: 2020 },
        { schemeYear: 2018 },
        { schemeYear: 2022 }
      ]
    })
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2018)
    expect(result.length).toBe(9)
  })

  test('should ignore non-numeric and non-positive schemeYear values', () => {
    const result = generateSchemeYears({
      paymentsByScheme: [
        { schemeYear: '2020' },
        { schemeYear: -1 },
        { schemeYear: null },
        { schemeYear: 2021 }
      ]
    })
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2021)
    expect(result.length).toBe(6)
  })

  test('should return years from current year to 2015 if all schemeYear values are invalid', () => {
    const result = generateSchemeYears({
      paymentsByScheme: [
        { schemeYear: 'foo' },
        { schemeYear: null },
        { schemeYear: -100 }
      ]
    })
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2015)
    expect(result.length).toBe(12)
  })

  test('should return years from current year to minimum valid schemeYear when mixed valid/invalid', () => {
    const result = generateSchemeYears({
      paymentsByScheme: [
        { schemeYear: 'foo' },
        { schemeYear: 2017 },
        { schemeYear: null },
        { schemeYear: 2020 }
      ]
    })
    expect(result[0]).toBe(2026)
    expect(result[result.length - 1]).toBe(2017)
    expect(result.length).toBe(10)
  })
})
