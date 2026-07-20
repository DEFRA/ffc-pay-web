const { HOME, FINANCE_REPORTS_LINKS, MONITORING_LINKS, PAYMENT_HOLDS_LINKS, MANUAL_PAYMENTS_LINKS, AGREEMENT_CLOSURES_LINKS, PAYMENT_ALERTS_LINKS, DOWNLOAD_STATEMENTS_LINKS, METRICS_LINKS, RESET_PAYMENT_REQUEST_LINKS, HELP_LINKS } = require('./section-links')

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Reports', description: 'Generate and download reports', links: FINANCE_REPORTS_LINKS },
  { title: 'Payment events', description: 'View payment and events and requests', links: MONITORING_LINKS },
  { title: 'Payment holds', description: 'View, add or remove payment holds', links: PAYMENT_HOLDS_LINKS },
  { title: 'Manual payments', description: 'Manually upload payment files', links: MANUAL_PAYMENTS_LINKS },
  { title: 'Agreement closures', description: 'Search and update closures, or add new closures individually or in bulk', links: AGREEMENT_CLOSURES_LINKS },
  { title: 'Email alerts', description: 'Manage where payment alerts are sent by the scheme or recipient', links: PAYMENT_ALERTS_LINKS },
  { title: 'Statements', description: 'Find and download payment statements and statement status reports', links: DOWNLOAD_STATEMENTS_LINKS },
  { title: 'Metrics', description: 'View payment and document metrics by scheme', links: METRICS_LINKS },
  { title: 'Reset payment requests', description: 'Manually reset payment requests', links: RESET_PAYMENT_REQUEST_LINKS },
  { title: 'Help', links: HELP_LINKS }
]
