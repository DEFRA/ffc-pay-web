const { handleBulkClosureError } = require('../../../app/closure/handle-bulk-closure-error')

describe('handleBulkClosureError', () => {
  let h

  beforeEach(() => {
    h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }
  })

  test.each([
    ['string error', 'Test error message', { details: [{ message: 'Test error message' }] }],
    ['structured validation error', { details: [{ message: 'Validation error' }] }, { details: [{ message: 'Validation error' }] }]
  ])('handles %s', (_desc, errorInput, expectedErrors) => {
    const result = handleBulkClosureError(h, errorInput)

    expect(h.view).toHaveBeenCalledWith('closure/bulk', { errors: expectedErrors })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe(h)
  })
})
