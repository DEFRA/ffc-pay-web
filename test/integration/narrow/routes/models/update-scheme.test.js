const ViewModel = require('../../../../../app/routes/models/update-scheme')

const getText = (name, active) =>
  active ? `Would you like to disable ${name}?` : `Would you like to enable ${name}?`

describe('ViewModel', () => {
  const value = { schemeId: '1', name: 'Test', active: true }

  test.each([
    [true, { text: 'Please select yes or no to update.' }],
    [false, undefined]
  ])('adds error message when error is %s', (error, expected) => {
    const viewModel = new ViewModel(value, error)
    expect(viewModel.model.errorMessage).toEqual(expected)
  })
})

describe('getText', () => {
  test.each([
    [true, 'Would you like to disable Test?'],
    [false, 'Would you like to enable Test?']
  ])('returns correct message when active is %s', (active, expected) => {
    expect(getText('Test', active)).toBe(expected)
  })
})
