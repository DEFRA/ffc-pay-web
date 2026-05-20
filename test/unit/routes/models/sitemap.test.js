const ViewModel = require('../../../../app/routes/models/sitemap')

describe('sitemap viewModel', () => {
  test('returns default model when no sections provided', () => {
    const vm = new ViewModel()
    expect(vm.model).toEqual({ title: { text: 'Sitemap' }, sections: [] })
  })

  test('maps string links to objects and preserves provided objects', () => {
    const input = [
      { title: 'Section One', links: ['http://example.com', { href: '/about', text: 'About' }] },
      { links: ['onlylink'] }
    ]
    const vm = new ViewModel(input)

    expect(vm.model.title).toEqual({ text: 'Sitemap' })
    expect(vm.model.sections).toHaveLength(2)

    expect(vm.model.sections[0]).toEqual({
      title: 'Section One',
      links: [
        { href: 'http://example.com', text: 'http://example.com' },
        { href: '/about', text: 'About' }
      ]
    })

    expect(vm.model.sections[1]).toEqual({
      title: '',
      links: [{ href: 'onlylink', text: 'onlylink' }]
    })
  })

  test('handles null sections gracefully', () => {
    const vm = new ViewModel(null)
    expect(vm.model.sections).toEqual([])
  })
})
