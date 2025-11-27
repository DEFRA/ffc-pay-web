const { handleBulkPost } = require('../../../app/hold/handle-bulk-post')
const { postProcessing } = require('../../../app/api')
const { getHoldCategories } = require('../../../app/holds')
const { readFileContent } = require('../../../app/helpers/read-file-content')
const { processHoldData } = require('../../../app/hold/process-hold-data')
const { setLoadingStatus } = require('../../../app/helpers/set-loading-status')
const filePath = require('../../mocks/values/file-path')
const { FRN } = require('../../mocks/values/frn')

jest.mock('../../../app/api')
jest.mock('../../../app/holds')
jest.mock('../../../app/helpers/read-file-content')
jest.mock('../../../app/hold/process-hold-data')
jest.mock('../../../app/helpers/set-loading-status')
jest.mock('uuid', () => ({ v4: () => '123-456' }))

describe('handleBulkPost', () => {
  let request
  const h = {
    view: jest.fn(() => ({
      code: jest.fn(() => ({
        takeover: jest.fn()
      }))
    })),
    redirect: jest.fn()
  }

  const mockPaymentHoldCategories = [{
    holdCategoryId: 123,
    name: 'my hold category',
    schemeName: 'Scheme Name'
  }]

  const setupDefaultMocks = () => {
    readFileContent.mockReturnValue(FRN)
    processHoldData.mockResolvedValue({ uploadData: [FRN], errors: null })
    getHoldCategories.mockResolvedValue({
      schemes: ['Scheme Name'],
      paymentHoldCategories: mockPaymentHoldCategories
    })
    setLoadingStatus.mockResolvedValue({ status: 'completed' })
  }

  const expectFileReadError = () => {
    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['Scheme Name'],
      paymentHoldCategories: mockPaymentHoldCategories,
      errors: { details: [{ message: 'An error occurred whilst reading the file' }] }
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    request = {
      payload: {
        file: {
          path: filePath,
          filename: 'bulkHolds.csv',
          bytes: 123,
          headers: {
            'content-disposition': 'string',
            'content-type': 'text/csv'
          }
        },
        remove: false,
        holdCategoryId: '124'
      }
    }
    setupDefaultMocks()
  })

  describe('successful processing', () => {
    test('should generate a jobId and render loading view', async () => {
      await handleBulkPost(request, h)
      expect(h.view).toHaveBeenCalledWith('payment-holds/holds-loading', { jobId: '123-456' })
    })

    test('should set initial loading status to processing', async () => {
      await handleBulkPost(request, h)
      expect(setLoadingStatus).toHaveBeenCalledWith(
        request,
        '123-456',
        { status: 'processing' }
      )
    })

    test('should call processUpload with correct parameters', async () => {
      await handleBulkPost(request, h)
      expect(postProcessing).toHaveBeenCalledWith('/payment-holds/bulk/add', {
        data: [FRN],
        holdCategoryId: '124'
      }, null)
    })

    test('should call remove endpoint when remove is true', async () => {
      request.payload.remove = true
      await handleBulkPost(request, h)
      expect(postProcessing).toHaveBeenCalledWith('/payment-holds/bulk/remove', {
        data: [FRN],
        holdCategoryId: '124'
      }, null)
    })
  })

  describe('file read errors', () => {
    test('handles unexpected error', async () => {
      readFileContent.mockImplementation(() => { throw new Error('Unexpected error') })
      await handleBulkPost(request, h)
      expectFileReadError()
    })

    test('handles empty file', async () => {
      readFileContent.mockReturnValue('')
      await handleBulkPost(request, h)
      expectFileReadError()
    })

    test('handles null file', async () => {
      readFileContent.mockReturnValue(null)
      await handleBulkPost(request, h)
      expectFileReadError()
    })
  })

  describe('validation errors', () => {
    test('with FRN', async () => {
      const validationError = new Error('Validation error')
      validationError.name = 'ValidationError'
      validationError._original = { frn: 'badfrn' }
      validationError.details = [{ message: 'Invalid FRN' }]
      processHoldData.mockResolvedValue({ uploadData: null, errors: validationError })

      await handleBulkPost(request, h)
      expect(setLoadingStatus).toHaveBeenCalledWith(request, '123-456', {
        status: 'failed',
        message: 'There was a problem validating your uploaded data. The FRN, "badfrn" is invalid. Please check your file and try again.'
      })
    })

    test('without FRN', async () => {
      const validationError = new Error('Validation error')
      validationError.name = 'ValidationError'
      validationError._original = {}
      validationError.details = [{ message: 'Missing FRN' }]
      processHoldData.mockResolvedValue({ uploadData: null, errors: validationError })

      await handleBulkPost(request, h)
      expect(setLoadingStatus).toHaveBeenCalledWith(request, '123-456', {
        status: 'failed',
        message: 'There was a problem validating your uploaded data: Missing FRN. Please check your file and try again.'
      })
    })
  })

  describe('other processing errors', () => {
    test('handles general processHoldData errors', async () => {
      const otherError = { details: [{ message: 'Other error' }] }
      processHoldData.mockResolvedValue({ uploadData: null, errors: otherError })

      await handleBulkPost(request, h)
      expect(setLoadingStatus).toHaveBeenCalledWith(request, '123-456', {
        status: 'failed',
        message: 'An error occurred while processing the data: Other error'
      })
    })
  })
})
