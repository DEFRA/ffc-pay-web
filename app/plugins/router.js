const config = require('../config')

let routes = [].concat(
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/static'),
  require('../routes/home'),
  require('../routes/authenticate'),
  require('../routes/login'),
  require('../routes/logout'),
  require('../routes/holds'),
  require('../routes/monitoring'),
  require('../routes/payment-requests'),
  require('../routes/dev-auth'),
  require('../routes/view-processed-payment-requests'),
  require('../routes/closures'),
  require('../routes/loading'),
  require('../routes/download-report-list'),
  require('../routes/generate-report-list'),
  require('../routes/download-report-list/report'),
  require('../routes/download-report-list/request-editor-report'),
  require('../routes/generate-report-list/ap-ar-report'),
  require('../routes/generate-report-list/payment-requests-report-v2'),
  require('../routes/generate-report-list/status-report'),
  require('../routes/report-list/report-generation'),
  require('../routes/manual-payments'),
  require('../routes/alerts'),
  require('../routes/metrics'),
  require('../routes/statements/download-statements'),
  require('../routes/statements/status-report'),
  require('../routes/statement-results'),
  require('../routes/accessibility'),
  require('../routes/privacy'),
  require('../routes/cookies'),
  require('../routes/sitemap')
)

if (config.legacyReportsEnabled) {
  routes = routes.concat(require('../routes/report-list/claim-level-report'), require('../routes/report-list/transaction-summary-report'))
}

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
