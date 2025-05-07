const routes = [].concat(
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/static'),
  require('../routes/home'),
  require('../routes/authenticate'),
  require('../routes/login'),
  require('../routes/logout'),
  require('../routes/holds'),
  require('../routes/schemes'),
  require('../routes/monitoring'),
  require('../routes/payment-requests'),
  require('../routes/report'),
  require('../routes/dev-auth'),
  require('../routes/view-processed-payment-requests'),
  require('../routes/closure'),
  require('../routes/view-closures'),
  require('../routes/report-list'),
  require('../routes/ap-ar-listing'),
  require('../routes/ar-listing'),
  require('../routes/report-generation')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
