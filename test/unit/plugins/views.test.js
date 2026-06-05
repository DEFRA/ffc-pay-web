const path = require('node:path')
const nunjucks = require('nunjucks')
const config = require('../../../app/config')
const viewsPlugin = require('../../../app/plugins/views')

describe('app/plugins/views.js', () => {
  const originalIsDev = config.isDev

  afterAll(() => {
    config.isDev = originalIsDev
  })

  test('engine compile renders template with provided environment and context', () => {
    const src = 'Hello {{name}}'
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader([]))
    const compileOptions = { environment: env }
    const compile = viewsPlugin.options.engines.njk.compile
    const render = compile(src, { compileOptions })
    const out = render({ name: 'Alice' })
    expect(out).toBe('Hello Alice')
  })

  test('prepare sets up environment, filters and global and assigns to compileOptions.environment', (done) => {
    const options = {
      path: ['../views'],
      relativeTo: path.join(__dirname, '..'),
      compileOptions: {},
      context: {}
    }

    viewsPlugin.options.engines.njk.prepare(options, (err) => {
      expect(err).toBeUndefined()
      const env = options.compileOptions.environment
      expect(env).toBeDefined()

      const localize = env.getFilter ? env.getFilter('localize') : null
      if (localize) {
        expect(localize(12345)).toBe('12,345')
        expect(localize(null)).toBe('0')
        expect(localize('')).toBe('0')
      } else {
        const tpl = '{{ 12345 | localize }} {{ null | localize }} {{ "" | localize }}'
        const rendered = env.renderString ? env.renderString(tpl) : null
        expect(rendered).not.toBeNull()
        expect(rendered).toContain('12,345')
      }

      const sentencesFilter = env.getFilter ? env.getFilter('sentences') : null
      if (sentencesFilter) {
        const res = sentencesFilter('Hello world. Bye!')
        expect(Array.isArray(res)).toBe(true)
        expect(res).toEqual(['Hello world.', 'Bye!'])
      } else {
        const tpl2 = '{{ "Hello world. Bye!" | sentences | join(",") }}'
        const rendered2 = env.renderString ? env.renderString(tpl2) : null
        expect(rendered2).toBe('Hello world.,Bye!')
      }

      const getAssetPath = env.getGlobal ? env.getGlobal('getAssetPath') : null
      if (getAssetPath) {
        expect(getAssetPath('/img.png')).toBe('/static/img.png')
        expect(getAssetPath('img.png')).toBe('/static/img.png')
      } else {
        const tpl3 = '{{ getAssetPath("/img.png") }}'
        const rendered3 = env.renderString ? env.renderString(tpl3, options.context) : null
        expect(rendered3).toBe('/static/img.png')
      }

      done()
    })
  })

  test('getAssetPath honors provided context assetPath and trims slashes', (done) => {
    const options = {
      path: ['../views'],
      relativeTo: path.join(__dirname, '..'),
      compileOptions: {},
      context: { assetPath: '/base/' }
    }

    viewsPlugin.options.engines.njk.prepare(options, (err) => {
      expect(err).toBeUndefined()
      const env = options.compileOptions.environment
      const getAssetPath = env.getGlobal ? env.getGlobal('getAssetPath') : null
      if (getAssetPath) {
        expect(getAssetPath('/x.png')).toBe('/base/x.png')
        expect(getAssetPath('x.png')).toBe('/base/x.png')
        expect(getAssetPath('')).toBe('/base')
      } else {
        const tpl = '{{ getAssetPath("/x.png") }} {{ getAssetPath("") }}'
        const rendered = env.renderString ? env.renderString(tpl, options.context) : null
        expect(rendered).toContain('/base/x.png')
      }
      done()
    })
  })

  test('sentences filter handles arrays, numbers, empty and non-string inputs', (done) => {
    const options = {
      path: ['../views'],
      relativeTo: path.join(__dirname, '..'),
      compileOptions: {},
      context: {}
    }

    viewsPlugin.options.engines.njk.prepare(options, (err) => {
      expect(err).toBeUndefined()
      const env = options.compileOptions.environment
      const sentencesFilter = env.getFilter ? env.getFilter('sentences') : null

      if (sentencesFilter) {
        const arr = ['One.', 'Two!']
        expect(sentencesFilter(arr)).toEqual(arr)
        expect(sentencesFilter(0)).toEqual(['0'])
        expect(sentencesFilter('')).toEqual([])
        expect(sentencesFilter(undefined)).toEqual([])
        expect(sentencesFilter(null)).toEqual([])
        const complex = ' First sentence!  Second sentence... Third?  '
        expect(sentencesFilter(complex)).toEqual(['First sentence!', 'Second sentence...', 'Third?'])
      } else {
        const tpl = [
          '{{ ["One.","Two!"] | sentences | join("|") }}',
          '{{ 0 | sentences | join("|") }}',
          '{{ "" | sentences | join("|") }}',
          '{{ null | sentences | join("|") }}',
          '{{ " First sentence!  Second sentence... Third?  " | sentences | join("||") }}'
        ].join('\n')
        const rendered = env.renderString ? env.renderString(tpl) : ''
        expect(rendered.split('\n')[0]).toBe('One.|Two!')
        expect(rendered.split('\n')[1]).toBe('0')
        expect(rendered.split('\n')[2]).toBe('')
        expect(rendered.split('\n')[3]).toBe('')
        expect(rendered.split('\n')[4]).toBe('First sentence!||Second sentence...||Third?')
      }

      done()
    })
  })
})
