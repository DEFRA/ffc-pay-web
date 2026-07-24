const permissions = require('../auth/permissions')

const HOME = { href: '/', text: 'Home' }

const PAYMENT_HOLDS_LINKS = [
  { href: '/payment-holds/manage', text: 'Manage payment holds', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin] },
  { href: '/payment-holds/add', text: 'Create a new payment hold', description: 'Create a new hold for a payment' },
  { href: '/payment-holds/search', text: 'Search for a payment hold', description: 'Search, view or remove an existing payment hold' },
  { href: '/payment-holds/bulk-manage', text: 'Manage payment holds in bulk', description: 'Manage multiple payment holds at the same time' },
  { href: '/payment-holds/types', text: 'Manage payment hold types', description: 'Create, edit and remove payment hold types' }
]

const FINANCE_REPORTS_LINKS = [
  { href: '/download-report-list', text: 'Download reports', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] },
  { href: '/download-report-list/request-editor-report', text: 'Request editor report' },
  { href: '/generate-report-list/generate-payment-request-statuses', text: 'Generate payment request statuses report', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView] },
  { href: '/generate-report-list/generate-ap-ar-listing-report', text: 'AP/AR listing report', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView] }
]

const GENERATE_REPORTS_LINKS = [
  { href: '/generate-report-list', text: 'Generate / find and download reports', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] },
  { href: '/generate-report-list/find-payment-statement-status-report', text: 'Payment statement status report' },
  { href: '/generate-report-list/generate-ap-ar-listing-report', text: 'AP/AR listing report' },
  { href: '/generate-report-list/generate-payment-request-statuses', text: 'Generate payment request statuses report' }
]

const PAYMENT_ALERTS_LINKS = [
  { href: '/alerts', text: 'Alerts', homeAuth: [permissions.applicationAdmin, permissions.alertAdmin] },
  { href: '/alerts/information', text: 'Alerts information' },
  { href: '/alerts/update', text: 'Add new alert recipient' }
]

const AGREEMENT_CLOSURES_LINKS = [
  { href: '/closure/manage', text: 'Manage agreement closures', homeAuth: [permissions.applicationAdmin] },
  { href: '/closure/search', text: 'Search agreement closures', description: 'Search and update an active agreement closure' },
  { href: '/closure/add', text: 'Create a new agreement closure', description: 'Add a new agreement closure' },
  { href: '/closure/bulk', text: 'Bulk add agreement closures', description: 'Add multiple new agreement closures' }
]

const MONITORING_LINKS = [
  { href: '/monitoring', text: 'Monitoring', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView] },
  { href: '/monitoring/schemes', text: 'Schemes', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView] }
]

const MANUAL_PAYMENTS_LINKS = [
  { href: '/manual-payments', text: 'Manual payment upload', homeAuth: [permissions.applicationAdmin, permissions.manualPaymentsAdmin] }
]

const RESET_PAYMENT_REQUEST_LINKS = [
  { href: '/payment-request/reset', text: 'Reset payment request', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin] }
]

const METRICS_LINKS = [
  { href: '/metrics', text: 'View metrics dashboard', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin] }
]

const DOWNLOAD_STATEMENTS_LINKS = [
  { href: '/download-statements', text: 'Download payment statements', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] },
  { href: '/status-report', text: 'Download statement status report', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] }
]

const HELP_LINKS = [
  { href: '/accessibility', text: 'Accessibility statement' },
  { href: '/cookies', text: 'Cookies' },
  { href: '/privacy', text: 'Privacy' }
]

module.exports = {
  HOME,
  PAYMENT_HOLDS_LINKS,
  FINANCE_REPORTS_LINKS,
  GENERATE_REPORTS_LINKS,
  PAYMENT_ALERTS_LINKS,
  AGREEMENT_CLOSURES_LINKS,
  MONITORING_LINKS,
  MANUAL_PAYMENTS_LINKS,
  RESET_PAYMENT_REQUEST_LINKS,
  METRICS_LINKS,
  DOWNLOAD_STATEMENTS_LINKS,
  HELP_LINKS
}
