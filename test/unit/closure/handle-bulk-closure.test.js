const fs = require('fs')
const { handleBulkClosure } = require('../../../app/closure/handle-bulk-closure')
const { handleBulkClosureError } = require('../../../app/closure/handle-bulk-closure-error')
const { post } = require('../../../app/api')
const { processClosureData } = require('../../../app/closure')

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}))
jest.mock('../../../app/closure/handle-bulk-closure-error', () => ({
  handleBulkClosureError: jest.fn()
}))
jest.mock('../../../app/api', () => ({
  post: jest.fn()
}))
jest.mock('../../../app/closure', () => ({
  processClosureData: jest.fn()
}))

describe('handleBulkClosure', () => {
  let request, h

  beforeEach(() => {
    jest.clearAllMocks()
    request = {
      payload: {
        file: { path: '/tmp/test-file.csv' },
        crumb: 'test-crumb'
      },
      state: { crumb: 'state-crumb' }
    }
    h = {
      redirect: jest.fn(),
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }
  })

  test('returns error when file structure is invalid', async () => {
    request.payload.file = null

    await handleBulkClosure(request, h)

    expect(fs.readFileSync).not.toHaveBeenCalled()
    expect(processClosureData).not.toHaveBeenCalled()
    expect(handleBulkClosureError).toHaveBeenCalledWith(h, 'Invalid file structure or missing file path.', 'test-crumb')
  })

  test('returns error when file reading fails', async () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File read error')
    })

    await handleBulkClosure(request, h)

    expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/test-file.csv', 'utf8')
    expect(processClosureData).not.toHaveBeenCalled()
    expect(handleBulkClosureError).toHaveBeenCalledWith(h, 'An error occurred whilst reading the file.', 'test-crumb')
  })

  test('redirects to BASE when processing is successful', async () => {
    const mockUploadData = { key: 'value' }
    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({ uploadData: mockUploadData, errors: null })

    await handleBulkClosure(request, h)

    expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/test-file.csv', 'utf8')
    expect(processClosureData).toHaveBeenCalledWith('file content')
    expect(post).toHaveBeenCalledWith('/closure/bulk', { data: mockUploadData }, null)
    expect(h.redirect).toHaveBeenCalledWith('/closure')
  })

  test('returns error when file path is not a string', async () => {
    request.payload.file.path = null

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(h, 'Invalid file structure or missing file path.', 'test-crumb')
  })

  test('returns error when file is empty', async () => {
    fs.readFileSync.mockReturnValue('')

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(h, 'File is empty or could not be read.', 'test-crumb')
  })

  test('returns error when processClosureData returns errors', async () => {
    const mockErrors = { details: [{ message: 'Processing error' }] }
    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({ uploadData: null, errors: mockErrors })

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(h, mockErrors, 'test-crumb')
  })

  test('redirects to BASE when processing is successful', async () => {
    const mockUploadData = { key: 'value' }
    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({ uploadData: mockUploadData, errors: null })

    await handleBulkClosure(request, h)

    expect(post).toHaveBeenCalledWith('/closure/bulk', { data: mockUploadData }, null)
    expect(h.redirect).toHaveBeenCalledWith('/closure')
  })
})
