const { PassThrough } = require('stream')
const { generateReport } = require('../../../app/reporting/index')

jest.mock('../../../app/storage/pay-reports.js', () => ({
  getDataRequestFile: jest.fn()
}))
const { getDataRequestFile } = require('../../../app/storage')

jest.mock('../../../app/reporting/mapping', () => ({
  getDataFields: jest.fn()
}))
const { getDataFields } = require('../../../app/reporting/mapping')

jest.mock('../../../app/reporting/create-transform-stream', () => ({
  createTransformStream: jest.fn()
}))
const { createTransformStream } = require('../../../app/reporting/create-transform-stream')

jest.mock('JSONStream', () => ({
  parse: jest.fn()
}))
const JSONStream = require('JSONStream')

jest.mock('@fast-csv/format', () => ({
  format: jest.fn()
}))
const { format } = require('@fast-csv/format')

describe('generateReport', () => {
  let dummyReadable, dummyCSVStream, dummyTransformStream, onComplete, fileData

  beforeEach(() => {
    dummyReadable = new PassThrough({ objectMode: true })
    dummyTransformStream = new PassThrough({ objectMode: true })
    dummyCSVStream = new PassThrough({ objectMode: true })
    onComplete = jest.fn().mockResolvedValue()
    fileData = { readableStreamBody: dummyReadable }
    getDataRequestFile.mockReset()
    getDataFields.mockReset()
    createTransformStream.mockReset()
    JSONStream.parse.mockReset()
    format.mockReset()
  })

  test('returns null and warns if fileData has no readableStreamBody', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    getDataRequestFile.mockResolvedValue({})
    const result = await generateReport('filename', 'AP', onComplete)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No data available for report type: AP with filename: filename')
    )
    expect(result).toBeNull()
    warnSpy.mockRestore()
  })

  test('pipes stream through conversion pipeline and returns csvStream', async () => {
    getDataRequestFile.mockResolvedValue(fileData)
    const dummyFields = ['col1', 'col2']
    getDataFields.mockReturnValue(dummyFields)
    JSONStream.parse.mockReturnValue(dummyTransformStream)
    createTransformStream.mockReturnValue(dummyTransformStream)
    format.mockReturnValue(dummyCSVStream)

    process.nextTick(() => {
      dummyReadable.write('{"key": "value"}')
      dummyReadable.end()
    })

    const result = await generateReport('file.csv', 'AP', onComplete)
    expect(getDataRequestFile).toHaveBeenCalledWith('file.csv')
    expect(getDataFields).toHaveBeenCalledWith('AP')
    expect(JSONStream.parse).toHaveBeenCalledWith('*')
    expect(createTransformStream).toHaveBeenCalledWith(dummyFields, onComplete)
    expect(format).toHaveBeenCalledWith({ headers: true })
    expect(result).toBe(dummyCSVStream)
  })

  test('calls onComplete with error message and returns null if an error occurs', async () => {
    const errorMessage = 'Test error'
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) // Mock console.error

    getDataRequestFile.mockRejectedValue(new Error(errorMessage))

    const result = await generateReport('file.csv', 'AP', onComplete)

    expect(onComplete).toHaveBeenCalledWith(errorMessage)
    expect(result).toBeNull()
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error generating report for AP with filename file.csv:')
    )

    consoleErrorSpy.mockRestore() // Restore console.error after the test
  })
})
