const path = require('node:path')
const nunjucks = require('nunjucks')
const config = require('../config')
const { version } = require('../../package.json')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          const env = nunjucks.configure([
            path.join(options.relativeTo || process.cwd(), ...options.path),
            'app/views',
            'node_modules/govuk-frontend/dist'
          ], {
            autoescape: true,
            watch: config.isDev
          })

          env.addFilter('localize', function (num) {
            if (num === null || num === undefined || num === '') {
              return '0'
            }
            return Number(num).toLocaleString('en-GB')
          })

          env.addFilter('localizeCurrency', function (num) {
            if (num === null || num === undefined || num === '') {
              return '0.00'
            }

            const value = Number(num)

            const formatted = value.toLocaleString('en-GB', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
            return formatted
          })

          const sentenceSplitRegex = /[^.!?]+[.!?]*/g
          env.addFilter('sentences', function (text) {
            if (!text && text !== 0) {
              return []
            }
            if (Array.isArray(text)) {
              return text
            }
            return String(text).match(sentenceSplitRegex)?.map(s => s.trim()).filter(Boolean) || []
          })

          env.addGlobal('getAssetPath', function (assetPath) {
            const base = options?.context?.assetPath || '/static'
            const normalizedBase = String(base).replace(/\/+$/, '')
            const normalizedAsset = String(assetPath || '').replace(/^\/+/, '')
            return normalizedBase + (normalizedAsset ? '/' + normalizedAsset : '')
          })

          options.compileOptions.environment = env
          return next()
        }
      }
    },
    path: ['../views'],
    relativeTo: __dirname,
    isCached: !config.isDev,
    context: {
      appVersion: version,
      assetPath: '/static',
      govukAssetPath: '/assets',
      serviceName: config.serviceName,
      pageTitle: `${config.serviceName}`,
      bannerEnabled: config.bannerEnabled,
      bannerHeader: config.bannerHeader,
      bannerText: config.bannerText,
      bannerEmail: config.bannerEmail
    }
  }
}
