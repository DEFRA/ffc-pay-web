const HOME = { href: '/', text: 'Home' }

const PAYMENT_HOLDS_LINKS = [
  { href: '/payment-holds', text: 'Manage holds', homeAuth: ['Payment.Application.Admin', 'Payment.Hold.Admin'] },
  { href: '/add-payment-hold', text: 'Add payment hold' },
  { href: '/payment-holds/bulk', text: 'Bulk payment holds' },
]

const FINANCE_REPORTS_LINKS = [
  { href: '/report-list', text: 'Reports', homeAuth: ['Payment.Application.Admin', 'Payment.Hold.Admin', 'Payment.Scheme.Admin', 'Payment.Data.View', 'Statements.Status-Reports.Delinked', 'Statements.Status-Reports.SFI-23'] },
  { href: '/report-list/payment-requests-v2', text: 'Payment request statuses report' },
  { href: '/report-list/ap-ar-report', text: 'AP/AR listing report' },
  { href: '/report-list/request-editor-report', text: 'Request editor report' },
  { href: '/report-list/status-report', text: 'Payment statement status report' },
]

const PAYMENT_ALERTS_LINKS = [
  { href: '/alerts', text: 'Alerts', homeAuth: ['Payment.Application.Admin', 'Payment.Alert.Admin'] },
  { href: '/alerts/information', text: 'Alerts information' },
  { href: '/alerts/update', text: 'Add new alert recipient' },
]

const AGREEMENT_CLOSURES_LINKS = [
  { href: '/closure', text: 'Manage closures', homeAuth: ['Payment.Application.Admin', 'Payment.Closure.Admin'] },
  { href: '/closure/add', text: 'Agreement closure', homeAuth: [] },
  { href: '/closure/bulk', text: 'Bulk agreement closure', homeAuth: [] },
]

const MONITORING_LINKS = [
  { href: '/monitoring', text: 'Monitoring', homeAuth: ['Payment.Application.Admin', 'Payment.Hold.Admin', 'Payment.Scheme.Admin', 'Payment.Data.View'] },
  { href: '/monitoring/schemes', text: 'Schemes', homeAuth: [] },
]

const MANUAL_PAYMENTS_LINKS = [
  { href: '/manual-payments', text: 'Manual payment upload', homeAuth: ['Payment.Application.Admin', 'Payment.Manual-Payments.Admin'] }
]

const RESET_PAYMENT_REQUEST_LINKS = [
  { href: '/payment-request/reset', text: 'Reset payment request', homeAuth: ['Payment.Application.Admin', 'Payment.Scheme.Admin'] }
]

const METRICS_LINKS = [
  { href: '/metrics', text: 'Management information', homeAuth: ['Payment.Application.Admin', 'Payment.Scheme.Admin'] }
]

const DOWNLOAD_STATEMENTS_LINKS = [
  { href: '/download-statements', text: 'Download statements', homeAuth: ['Payment.Application.Admin'] }
]

const HELP_LINKS = [
  { href: '/accessibility', text: 'Accessibility statement' },
  { href: '/cookies', text: 'Cookies' },
  { href: '/privacy', text: 'Privacy' },
]

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Reports', links: FINANCE_REPORTS_LINKS },
  { title: 'Payment events', links: MONITORING_LINKS },
  { title: 'Holds', links: PAYMENT_HOLDS_LINKS },
  { title: 'Upload manual payments', links: MANUAL_PAYMENTS_LINKS },
  { title: 'Agreement closures', links: AGREEMENT_CLOSURES_LINKS },
  { title: 'Payment alerts', links: PAYMENT_ALERTS_LINKS },
  { title: 'Download statements', links: DOWNLOAD_STATEMENTS_LINKS },
  { title: 'Management information', links: METRICS_LINKS },
  { title: 'Reset payment requests', links: RESET_PAYMENT_REQUEST_LINKS },
  { title: 'Help', links: HELP_LINKS }
]
