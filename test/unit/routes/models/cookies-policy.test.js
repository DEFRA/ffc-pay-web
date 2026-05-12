const ViewModel = require('../../../../app/routes/models/cookies-policy')

describe('cookies-policy viewModel', () => {
  test('defaults when no args', () => {
    const vm = new ViewModel()
    expect(vm.analytics.idPrefix).toBe('analytics')
    expect(vm.analytics.name).toBe('analytics')
    expect(vm.analytics.fieldset.legend.text).toBe('Do you want to accept cookies that measure website use?')
    expect(vm.analytics.items).toHaveLength(2)
    expect(vm.analytics.items[0]).toEqual(expect.objectContaining({ value: true, text: 'Yes' }))
    expect(vm.analytics.items[1]).toEqual(expect.objectContaining({ value: false, text: 'No' }))
    expect(vm.analytics.items[0].checked).toBeUndefined()
    expect(vm.analytics.items[1].checked).toBe(true)
    expect(vm.updated).toBe(false)
  })

  test('when analytics is true and updated flag set', () => {
    const vm = new ViewModel({ analytics: true }, true)
    expect(vm.analytics.items[0].checked).toBe(true)
    expect(vm.analytics.items[1].checked).toBe(false)
    expect(vm.updated).toBe(true)
  })

  test('when analytics is false', () => {
    const vm = new ViewModel({ analytics: false })
    expect(vm.analytics.items[0].checked).toBe(false)
    expect(vm.analytics.items[1].checked).toBe(true)
    expect(vm.updated).toBe(false)
  })
})
