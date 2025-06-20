const { handleBulkPost } = require('../../../app/hold/handle-bulk-post')
const { post } = require('../../../app/api')
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

describe('handle bulk post', () => {
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
    readFileContent.mockReturnValue(FRN)
    processHoldData.mockResolvedValue({ uploadData: [FRN], errors: null })
    getHoldCategories.mockResolvedValue({
      schemes: ['Scheme Name'],
      paymentHoldCategories: mockPaymentHoldCategories
    })
    setLoadingStatus.mockResolvedValue({ status: 'completed' })
  })

  test('should generate a jobId using uuid', async () => {
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

  test('should call processUpload with correct parameters when processHoldData succeeds', async () => {
    const uploadData = [FRN]
    processHoldData.mockResolvedValue({ uploadData, errors: null })

    await handleBulkPost(request, h)

    expect(post).toHaveBeenCalledWith('/payment-holds/bulk/add', {
      data: uploadData,
      holdCategoryId: '124'
    }, null)
  })

  test('should return loading view with jobId', async () => {
    await handleBulkPost(request, h)
    expect(h.view).toHaveBeenCalledWith('payment-holds/holds-loading', {
      jobId: '123-456'
    })
  })

  test('should handle unexpected errors', async () => {
    readFileContent.mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    await handleBulkPost(request, h)

    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['Scheme Name'],
      paymentHoldCategories: mockPaymentHoldCategories,
      errors: { details: [{ message: 'An error occurred whilst reading the file' }] }
    })
  })

  test('should handle empty file content', async () => {
    readFileContent.mockReturnValue('')

    await handleBulkPost(request, h)

    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['Scheme Name'],
      paymentHoldCategories: mockPaymentHoldCategories,
      errors: { details: [{ message: 'An error occurred whilst reading the file' }] }
    })
  })

  test('should handle null file content', async () => {
    readFileContent.mockReturnValue(null)

    await handleBulkPost(request, h)

    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['Scheme Name'],
      paymentHoldCategories: mockPaymentHoldCategories,
      errors: { details: [{ message: 'An error occurred whilst reading the file' }] }
    })
  })

  test('should call correct endpoint when remove is true', async () => {
    request.payload.remove = true
    const uploadData = [FRN]
    processHoldData.mockResolvedValue({ uploadData, errors: null })

    await handleBulkPost(request, h)

    expect(post).toHaveBeenCalledWith('/payment-holds/bulk/remove', {
      data: uploadData,
      holdCategoryId: '124'
    }, null)
  })

  test('should handle validation error with FRN', async () => {
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

  test('should handle validation error without FRN', async () => {
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

  test('should handle other errors from processHoldData', async () => {
    const otherError = { details: [{ message: 'Other error' }] }
    processHoldData.mockResolvedValue({ uploadData: null, errors: otherError })

    await handleBulkPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(request, '123-456', {
      status: 'failed',
      message: 'An error occurred while processing the data: Other error'
    })
  })
})
