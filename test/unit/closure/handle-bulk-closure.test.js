const fs = require('fs')
const { handleBulkClosure } = require('../../../app/closure/handle-bulk-closure')
const { handleBulkClosureError } = require('../../../app/closure/handle-bulk-closure-error')
const { postProcessing } = require('../../../app/api')
const { processClosureData } = require('../../../app/closure')

jest.mock('fs', () => ({ readFileSync: jest.fn() }))
jest.mock('../../../app/closure/handle-bulk-closure-error', () => ({ handleBulkClosureError: jest.fn() }))
jest.mock('../../../app/api', () => ({ postProcessing: jest.fn() }))
jest.mock('../../../app/closure', () => ({ processClosureData: jest.fn() }))

describe('handleBulkClosure', () => {
  let request, h

  beforeEach(() => {
    jest.clearAllMocks()
    request = {
      payload: { file: { path: '/tmp/test-file.csv' }, crumb: 'test-crumb' },
      state: { crumb: 'state-crumb' }
    }
    h = { redirect: jest.fn(), view: jest.fn().mockReturnThis(), code: jest.fn().mockReturnThis(), takeover: jest.fn() }
  })

  test.each([
    ['file structure invalid', () => { request.payload.file = null }, 'Invalid file structure or missing file path.'],
    ['file path not string', () => { request.payload.file.path = null }, 'Invalid file structure or missing file path.'],
    ['file read fails', () => { fs.readFileSync.mockImplementation(() => { throw new Error() }) }, 'An error occurred whilst reading the file.'],
    ['file empty', () => { fs.readFileSync.mockReturnValue('') }, 'File is empty or could not be read.'],
    ['processing errors', () => {
      fs.readFileSync.mockReturnValue('file content')
      processClosureData.mockResolvedValue({ uploadData: null, errors: { details: [{ message: 'Processing error' }] } })
    }, { details: [{ message: 'Processing error' }] }]
  ])('returns error when %s', async (_desc, setupFn, expectedMessage) => {
    if (setupFn) setupFn()
    await handleBulkClosure(request, h)
    expect(handleBulkClosureError).toHaveBeenCalledWith(h, expectedMessage, 'test-crumb')
  })

  test('redirects to BASE when processing is successful', async () => {
    const mockUploadData = { key: 'value' }
    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({ uploadData: mockUploadData, errors: null })

    await handleBulkClosure(request, h)

    expect(postProcessing).toHaveBeenCalledWith('/closure/bulk', { data: mockUploadData }, null)
    expect(h.redirect).toHaveBeenCalledWith('/closure')
  })
})
