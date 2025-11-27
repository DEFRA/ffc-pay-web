const ViewModel = require('../../../../../app/routes/models/search')

describe('ViewModel', () => {
  const labelText = 'Search for user'
  const value = '123456'

  test('creates model with correct label, value, input, and button classes', () => {
    const viewModel = new ViewModel(labelText, value)

    const model = viewModel.model
    expect(model.label.text).toBe(labelText)
    expect(model.value).toBe(value)
    expect(model.label.classes).toBe('govuk-!-font-weight-bold')
    expect(model.input.classes).toBe('govuk-input--width-20')
    expect(model.button.classes).toBe('search-button')
    expect(model.inputmode).toBe('numeric')
  })

  test('adds error message when error is provided', () => {
    const error = { message: 'Invalid input' }
    const viewModel = new ViewModel(labelText, value, error)

    expect(viewModel.model.errorMessage).toEqual({ text: 'Invalid input' })
  })

  test('does not add error message when error is not provided', () => {
    const viewModel = new ViewModel(labelText, value)
    expect(viewModel.model.errorMessage).toBeUndefined()
  })
})
