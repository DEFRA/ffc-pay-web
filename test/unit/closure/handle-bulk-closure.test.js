const fs = require('node:fs')
const {
  handleBulkClosure
} = require('../../../app/closure/handle-bulk-closure')
const { handleBulkClosureError } = require('../../../app/closure/handle-bulk-closure-error')
const { postRetention } = require('../../../app/api')
const { processClosureData } = require('../../../app/closure')

jest.mock('node:fs', () => ({ readFileSync: jest.fn() }))
jest.mock('../../../app/closure/handle-bulk-closure-error', () => ({ handleBulkClosureError: jest.fn() }))
jest.mock('../../../app/api', () => ({ postProcessing: jest.fn(), postRetention: jest.fn() }))
jest.mock('../../../app/closure', () => ({ processClosureData: jest.fn() }))

describe('handleBulkClosure', () => {
  let request
  let h

  beforeEach(() => {
    jest.clearAllMocks()

    request = {
      payload: {
        file: {
          path: '/tmp/test-file.csv'
        },
        crumb: 'test-crumb'
      },
      state: {
        crumb: 'state-crumb'
      },
      auth: {
        credentials: {
          account: {
            name: 'Test User',
            username: 'test-user',
            email: 'test@example.com'
          }
        }
      }
    }

    h = {
      redirect: jest.fn(),
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn()
    }
  })

  test.each([
    [
      'file structure invalid',
      () => {
        request.payload.file = null
      },
      'Invalid file structure or missing file path.'
    ],
    [
      'file path not string',
      () => {
        request.payload.file.path = null
      },
      'Invalid file structure or missing file path.'
    ],
    [
      'file read fails',
      () => {
        fs.readFileSync.mockImplementation(() => {
          throw new Error()
        })
      },
      'An error occurred whilst reading the file.'
    ],
    [
      'file empty',
      () => {
        fs.readFileSync.mockReturnValue('')
      },
      'File is empty or could not be read.'
    ],
    [
      'processing errors',
      () => {
        fs.readFileSync.mockReturnValue('file content')
        processClosureData.mockResolvedValue({
          uploadData: null,
          errors: {
            details: [
              {
                message: 'Processing error'
              }
            ]
          }
        })
      },
      {
        details: [
          {
            message: 'Processing error'
          }
        ]
      }
    ]
  ])('returns error when %s', async (_desc, setupFn, expectedMessage) => {
    setupFn()

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      expectedMessage,
      'test-crumb'
    )
  })

  test('redirects to MANAGE when processing is successful', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockResolvedValue()

    await handleBulkClosure(request, h)

    expect(postRetention).toHaveBeenCalledWith(
      '/closure/bulk',
      {
        data: mockUploadData,
        addedBy: 'Test User'
      },
      null
    )

    expect(h.redirect).toHaveBeenCalledWith('/closure/manage?closureAdded=bulk')
    expect(handleBulkClosureError).not.toHaveBeenCalled()
  })

  test('uses username as addedBy when name is unavailable', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    request.auth.credentials.account.name = undefined

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockResolvedValue()

    await handleBulkClosure(request, h)

    expect(postRetention).toHaveBeenCalledWith(
      '/closure/bulk',
      {
        data: mockUploadData,
        addedBy: 'test-user'
      },
      null
    )
  })

  test('uses email as addedBy when name and username are unavailable', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    request.auth.credentials.account.name = undefined
    request.auth.credentials.account.username = undefined

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockResolvedValue()

    await handleBulkClosure(request, h)

    expect(postRetention).toHaveBeenCalledWith(
      '/closure/bulk',
      {
        data: mockUploadData,
        addedBy: 'test@example.com'
      },
      null
    )
  })

  test('returns retention service error message when postRetention rejects with parsed payload buffer', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    const errorPayload = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'One or more closure records already exist.'
    }

    const error = new Error('Response Error: 400 Bad Request')
    error.data = {
      payload: Buffer.from(JSON.stringify(errorPayload))
    }

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockRejectedValue(error)

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      'One or more closure records already exist.',
      'test-crumb'
    )

    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('returns retention service error message when postRetention rejects with parsed payload string', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    const error = new Error('Response Error: 400 Bad Request')
    error.data = {
      payload: JSON.stringify({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The uploaded file contains duplicate records.'
      })
    }

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockRejectedValue(error)

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      'The uploaded file contains duplicate records.',
      'test-crumb'
    )

    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('returns default processing error when postRetention rejects without parseable payload', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    const error = new Error('Response Error: 400 Bad Request')
    error.data = {
      payload: 'not-json'
    }

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockRejectedValue(error)

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      'An error occurred whilst processing the bulk upload.',
      'test-crumb'
    )

    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('uses state crumb when payload crumb is unavailable', async () => {
    request.payload.crumb = undefined
    request.payload.file = null

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      'Invalid file structure or missing file path.',
      'state-crumb'
    )
  })

  test('passes undefined addedBy when auth account is unavailable', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    request.auth = undefined

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockResolvedValue()

    await handleBulkClosure(request, h)

    expect(postRetention).toHaveBeenCalledWith(
      '/closure/bulk',
      {
        data: mockUploadData,
        addedBy: undefined
      },
      null
    )

    expect(h.redirect).toHaveBeenCalledWith('/closure/manage?closureAdded=bulk')
  })

  test('uses output payload message when postRetention error has output payload message', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    const error = new Error('Response Error: 400 Bad Request')
    error.output = {
      payload: {
        message: 'Output payload failure message.'
      }
    }

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockRejectedValue(error)

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      'Output payload failure message.',
      'test-crumb'
    )

    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('uses data message when postRetention error has data message and no payload', async () => {
    const mockUploadData = [
      {
        key: 'value'
      }
    ]

    const error = new Error('Response Error: 400 Bad Request')
    error.data = {
      message: 'Data message failure.'
    }

    fs.readFileSync.mockReturnValue('file content')
    processClosureData.mockResolvedValue({
      uploadData: mockUploadData,
      errors: null
    })
    postRetention.mockRejectedValue(error)

    await handleBulkClosure(request, h)

    expect(handleBulkClosureError).toHaveBeenCalledWith(
      h,
      'Data message failure.',
      'test-crumb'
    )

    expect(h.redirect).not.toHaveBeenCalled()
  })
})
