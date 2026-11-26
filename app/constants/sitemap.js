const { HOME, FINANCE_REPORTS_LINKS, MONITORING_LINKS, PAYMENT_HOLDS_LINKS, MANUAL_PAYMENTS_LINKS, AGREEMENT_CLOSURES_LINKS, PAYMENT_ALERTS_LINKS, DOWNLOAD_STATEMENTS_LINKS, METRICS_LINKS, RESET_PAYMENT_REQUEST_LINKS, HELP_LINKS, PAYMENT_ALERTS_BY_RECIPIENT_LINKS } = require('./section-links')

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Reports', redirectFlag: 'REDIRECT_REPORTS', routePrefixes: ['/download-report-list', '/generate-report-list', '/report-list'], description: 'Generate and download reports', links: FINANCE_REPORTS_LINKS },
  { title: 'Payment events', redirectFlag: 'REDIRECT_PAYMENT_EVENTS', routePrefixes: ['/monitoring', '/monitoring-by-date'], description: 'Search and view payment events', links: MONITORING_LINKS },
  { title: 'Payment holds', redirectFlag: 'REDIRECT_PAYMENT_HOLDS', routePrefixes: ['/payment-holds'], description: 'View, add or remove payment holds', links: PAYMENT_HOLDS_LINKS },
  { title: 'Manual payments', redirectFlag: 'REDIRECT_MANUAL_PAYMENTS', routePrefixes: ['/manual-payments'], description: 'Upload payment files to be manually processed.', links: MANUAL_PAYMENTS_LINKS },
  { title: 'Agreement closures', redirectFlag: 'REDIRECT_AGREEMENT_CLOSURES', routePrefixes: ['/closure'], description: 'Search and update closures, or add new closures individually or in bulk', links: AGREEMENT_CLOSURES_LINKS },
  { title: 'Email alerts', redirectFlag: 'REDIRECT_EMAIL_ALERTS', routePrefixes: ['/alerts'], description: 'View, edit and add email alerts by recipient or scheme', links: [...PAYMENT_ALERTS_LINKS, ...PAYMENT_ALERTS_BY_RECIPIENT_LINKS] },
  { title: 'Statements', redirectFlag: 'REDIRECT_STATEMENTS', routePrefixes: ['/download-statements', '/status-report', '/statement-results'], description: 'Find and download payment statements and statement status reports', links: DOWNLOAD_STATEMENTS_LINKS },
  { title: 'Metrics dashboard', redirectFlag: 'REDIRECT_METRICS', routePrefixes: ['/metrics'], description: 'View payment and document metrics filtered by time period', links: METRICS_LINKS },
  { title: 'Reset payment requests', redirectFlag: 'REDIRECT_RESET_PAYMENT_REQUESTS', routePrefixes: ['/payment-request/reset'], description: 'Reset the payment request for an individual invoice', links: RESET_PAYMENT_REQUEST_LINKS },
  { title: 'Help', links: HELP_LINKS }
]
