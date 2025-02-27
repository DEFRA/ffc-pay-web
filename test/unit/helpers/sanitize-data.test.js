const { getPoundValue } = require('../../../app/helpers/get-pound-value')
const { convertDateToDDMMYYYY } = require('../../../app/helpers/convert-date-to-ddmmyyyy')
const { sanitizeData } = require('../../../app/helpers')

jest.mock('../../../app/helpers/convert-date-to-ddmmyyyy')
jest.mock('../../../app/helpers/get-pound-value')

describe('sanitizeData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should transform all fields in each object of the array', () => {
    const input = [{
      deltaAmount: 12345,
      value: 54321,
      daxValue: 54321,
      valueStillToProcess: 10000,
      apValue: 2000,
      arValue: 3000,
      receivedInRequestEditor: '28/11/2023T13:02:45',
      releasedFromRequestEditor: '29/11/2023T14:05:30',
      batchExportDate: '30/11/2023T09:15:00',
      lastUpdated: '01/12/2023T22:30:10'
    }]

    getPoundValue.mockImplementation(value => (value / 100).toFixed(2))
    convertDateToDDMMYYYY.mockImplementation(date => {
      const [day, month, yearWithTime] = date.split('/')
      const [year] = yearWithTime.split('T')
      return `${day}/${month}/${year}`
    })

    const result = sanitizeData(input)

    expect(getPoundValue).toHaveBeenCalledTimes(6)
    expect(convertDateToDDMMYYYY).toHaveBeenCalledTimes(4)

    expect(result).toEqual([{
      deltaAmount: '123.45',
      value: '543.21',
      daxValue: '543.21',
      valueStillToProcess: '100.00',
      apValue: '20.00',
      arValue: '30.00',
      receivedInRequestEditor: '28/11/2023',
      releasedFromRequestEditor: '29/11/2023',
      batchExportDate: '30/11/2023',
      lastUpdated: '01/12/2023'
    }])
  })

  test('should skip transformation for missing fields in each object', () => {
    const input = [{
      value: 54321,
      apValue: 2000,
      receivedInRequestEditor: '28/11/2023T13:02:45'
    }]

    getPoundValue.mockImplementation(value => (value / 100).toFixed(2))
    convertDateToDDMMYYYY.mockImplementation(date => {
      const [day, month, yearWithTime] = date.split('/')
      const [year] = yearWithTime.split('T')
      return `${day}/${month}/${year}`
    })

    const result = sanitizeData(input)

    expect(getPoundValue).toHaveBeenCalledTimes(2)
    expect(convertDateToDDMMYYYY).toHaveBeenCalledTimes(1)

    expect(result).toEqual([{
      value: '543.21',
      apValue: '20.00',
      receivedInRequestEditor: '28/11/2023'
    }])
  })

  test('should return the original array if no transformable fields exist', () => {
    const input = [{
      unrelatedField: 'test',
      anotherField: 123
    }]

    const result = sanitizeData(input)

    expect(getPoundValue).not.toHaveBeenCalled()
    expect(convertDateToDDMMYYYY).not.toHaveBeenCalled()

    expect(result).toEqual(input)
  })
})
