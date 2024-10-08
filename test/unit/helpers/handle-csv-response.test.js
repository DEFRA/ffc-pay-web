const convertToCSV = require('../../../app/helpers/convert-to-csv')
const { handleCSVResponse } = require('../../../app/helpers/handle-csv-response')

jest.mock('../../../app/helpers/convert-to-csv', () => jest.fn())

describe('handle CSV response', () => {
  const mockHapi = {
    response: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should handle CSV response with correct headers', () => {
    const data = [{ id: 1, name: 'Test' }]
    const filename = 'test.csv'

    convertToCSV.mockReturnValue('id,name\n1,Test')

    const handler = handleCSVResponse(data, filename)
    handler(mockHapi)

    expect(convertToCSV).toHaveBeenCalledWith(data)
    expect(mockHapi.response).toHaveBeenCalledWith('id,name\n1,Test')
    expect(mockHapi.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockHapi.header).toHaveBeenCalledWith('Content-Disposition', `attachment; filename=${filename}`)
  })

  test('should handle empty data', () => {
    const data = []
    const filename = 'empty.csv'

    convertToCSV.mockReturnValue('')

    const handler = handleCSVResponse(data, filename)
    handler(mockHapi)

    expect(convertToCSV).toHaveBeenCalledWith(data)
    expect(mockHapi.response).toHaveBeenCalledWith('')
    expect(mockHapi.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockHapi.header).toHaveBeenCalledWith('Content-Disposition', `attachment; filename=${filename}`)
  })

  test('should handle special characters in filename', () => {
    const data = [{ id: 2, name: 'Special' }]
    const filename = 'special@file.csv'

    convertToCSV.mockReturnValue('id,name\n2,Special')

    const handler = handleCSVResponse(data, filename)
    handler(mockHapi)

    expect(convertToCSV).toHaveBeenCalledWith(data)
    expect(mockHapi.response).toHaveBeenCalledWith('id,name\n2,Special')
    expect(mockHapi.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockHapi.header).toHaveBeenCalledWith('Content-Disposition', `attachment; filename=${filename}`)
  })
})
