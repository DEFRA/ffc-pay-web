const permissions = require('../auth/permissions')

const HOME = { href: '/', text: 'Home' }

const PAYMENT_HOLDS_LINKS = [
  { href: '/payment-holds', text: 'Manage holds', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin] },
  { href: '/add-payment-hold', text: 'Add payment hold' },
  { href: '/payment-holds/bulk', text: 'Bulk payment holds' },
]

const FINANCE_REPORTS_LINKS = [
  { href: '/report-list', text: 'Reports', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] },
  { href: '/report-list/payment-requests-v2', text: 'Payment request statuses report' },
  { href: '/report-list/ap-ar-report', text: 'AP/AR listing report' },
  { href: '/report-list/request-editor-report', text: 'Request editor report' },
]

const PAYMENT_ALERTS_LINKS = [
  { href: '/alerts', text: 'Alerts', homeAuth: [permissions.applicationAdmin, permissions.alertAdmin] },
  { href: '/alerts/information', text: 'Alerts information' },
  { href: '/alerts/update', text: 'Add new alert recipient' },
]

const AGREEMENT_CLOSURES_LINKS = [
  { href: '/closure', text: 'Manage closures', homeAuth: [permissions.applicationAdmin, permissions.closureAdmin] },
  { href: '/closure/add', text: 'Agreement closure', homeAuth: [permissions.applicationAdmin, permissions.closureAdmin] },
  { href: '/closure/bulk', text: 'Bulk agreement closure', homeAuth: [permissions.applicationAdmin, permissions.closureAdmin] },
]

const MONITORING_LINKS = [
  { href: '/monitoring', text: 'Monitoring', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView] },
  { href: '/monitoring/schemes', text: 'Schemes', homeAuth: [permissions.applicationAdmin, permissions.holdAdmin, permissions.schemeAdmin, permissions.dataView] },
]

const MANUAL_PAYMENTS_LINKS = [
  { href: '/manual-payments', text: 'Manual payment upload', homeAuth: [permissions.applicationAdmin, permissions.manualPaymentsAdmin] }
]

const RESET_PAYMENT_REQUEST_LINKS = [
  { href: '/payment-request/reset', text: 'Reset payment request', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin] }
]

const METRICS_LINKS = [
  { href: '/metrics', text: 'Management information', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin] }
]

const DOWNLOAD_STATEMENTS_LINKS = [
  { href: '/download-statements', text: 'Download payment statements', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] },
  { href: '/status-report', text: 'Download statement status report', homeAuth: [permissions.applicationAdmin, permissions.schemeAdmin, permissions.dataView, permissions.statusReportsDelinked, permissions.statusReportSfi23] }
]

const HELP_LINKS = [
  { href: '/accessibility', text: 'Accessibility statement' },
  { href: '/cookies', text: 'Cookies' },
  { href: '/privacy', text: 'Privacy' },
]

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Reports', description: 'Generate and download reports', links: FINANCE_REPORTS_LINKS },
  { title: 'Payment events', description: 'View payment and events and requests', links: MONITORING_LINKS },
  { title: 'Payment holds', description: 'View, add or remove payment holds', links: PAYMENT_HOLDS_LINKS },
  { title: 'Manual payments', description: 'Manually upload payment files', links: MANUAL_PAYMENTS_LINKS },
  { title: 'Agreement closures', description: 'Update, add and remove payment suppressions', links: AGREEMENT_CLOSURES_LINKS },
  { title: 'Email alerts', description: 'Manage where payment alerts are sent by the scheme or recipient', links: PAYMENT_ALERTS_LINKS },
  { title: 'Statements', description: 'Find and download payment statements and statement status reports.', links: DOWNLOAD_STATEMENTS_LINKS },
  { title: 'Metrics', description: 'View payment and document metrics by scheme', links: METRICS_LINKS },
  { title: 'Reset payment requests', description: 'Manually reset payment requests', links: RESET_PAYMENT_REQUEST_LINKS },
  { title: 'Help', links: HELP_LINKS }
]
