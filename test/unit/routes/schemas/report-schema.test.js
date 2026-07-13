jest.mock('../../../../app/routes/schemas/shared-validation-models', () => ({
  createValidationSchema: jest.fn()
}))

const { createValidationSchema } = require('../../../../app/routes/schemas/shared-validation-models')

describe('Validation schema module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call createValidationSchema with (false, true)', () => {
    const dummySchema = { type: 'dummy-schema' }
    createValidationSchema.mockReturnValue(dummySchema)

    const reportSchema = require('../../../../app/routes/schemas/reports/report-schema')

    expect(createValidationSchema).toHaveBeenCalledWith(false, true)
    expect(reportSchema).toBe(dummySchema)
  })
})
