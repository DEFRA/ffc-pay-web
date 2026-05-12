function viewModel (sections = []) {
  this.model = {
    title: { text: 'Sitemap' },
    sections: (sections || []).map(s => {
      const title = s.title || ''
      const links = (s.links || []).map(l => (typeof l === 'string' ? { href: l, text: l } : l))
      return { title, links }
    })
  }
}

module.exports = viewModel
