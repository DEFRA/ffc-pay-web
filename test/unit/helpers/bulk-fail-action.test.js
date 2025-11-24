const { bulkFailAction } = require('../../../app/helpers/bulk-fail-action')
const { getHoldCategories } = require('../../../app/holds')

jest.mock('../../../app/holds')

describe('bulkFailAction', () => {
  let request, h, holdCategories

  beforeEach(() => {
    jest.clearAllMocks()

    request = { payload: { crumb: 'test-crumb' }, state: { crumb: 'state-crumb' } }

    h = { view: jest.fn(() => h), code: jest.fn(() => h), takeover: jest.fn() }

    holdCategories = {
      schemes: [
        { name: 'scheme1', radios: [{ value: 'cat1', text: 'Category 1' }] }
      ],
      paymentHoldCategories: [{ holdCategoryId: 'cat1', schemeId: 'scheme1', name: 'Category 1' }]
    }

    getHoldCategories.mockResolvedValue(holdCategories)
  })

  const expectViewAndCode = (expectedErrors, crumb) => {
    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      holdCategoryRadios: [
        { scheme: { name: 'scheme1', radios: [{ value: 'cat1', text: 'Category 1' }] }, radios: [] }
      ],
      errors: expectedErrors,
      crumb
    })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
  }

  test('handles 413 error', async () => {
    const error = { output: { statusCode: 413 } }

    await bulkFailAction(request, h, error)

    expectViewAndCode(
      { details: [{ message: 'The uploaded file is too large. Please upload a file smaller than 1 MB.' }] },
      'test-crumb'
    )
  })

  test('handles generic error', async () => {
    const error = { message: 'Test error' }

    await bulkFailAction(request, h, error)

    expectViewAndCode(error, 'test-crumb')
  })

  test('uses state crumb if payload crumb missing', async () => {
    const requestWithoutPayloadCrumb = { state: { crumb: 'state-crumb' } }

    await bulkFailAction(requestWithoutPayloadCrumb, h, {})

    expectViewAndCode({}, 'state-crumb')
  })
})
