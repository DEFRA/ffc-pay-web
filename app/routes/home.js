const config = require('../config')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin, alertAdmin } = require('../auth/permissions')
const { getReportTypes } = require('../helpers/get-report-types')
const sitemap = require('../constants/sitemap')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin, alertAdmin] }

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      const reportTypes = Object.keys(getReportTypes())
      const cards = [...sitemap]
      cards.shift()
      cards.pop()
      for (const card of cards) {
        if (Array.isArray(card.links)) {
          card.links = card.links.filter(link => link.homeAuth)
          card.hasAccess = card.links.some(link => {
            return link.homeAuth.some(authFlag => request.auth.credentials.scope.includes(authFlag))
          })
        }
      }

      const accessibleCards = cards.filter(card => card.hasAccess)
      return h.view('home', {
        reportTypes,
        manualPaymentsActive: config.manualPaymentsActive,
        cards: accessibleCards
      })
    }
  }
}
