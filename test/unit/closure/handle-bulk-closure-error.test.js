const { handleBulkClosureError } = require('../../../app/closure/handle-bulk-closure-error')

describe('handleFileError', () => {
  let h

  beforeEach(() => {
    h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }
  })

  test('handles string-based error messages', () => {
    const result = handleBulkClosureError(h, 'Test error message')

    expect(h.view).toHaveBeenCalledWith('closure/bulk', {
      errors: { details: [{ message: 'Test error message' }] }
    })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe(h)
  })

  test('handles structured validation errors', () => {
    const validationError = { details: [{ message: 'Validation error' }] }
    const result = handleBulkClosureError(h, validationError)

    expect(h.view).toHaveBeenCalledWith('closure/bulk', { errors: validationError })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe(h)
  })
})
