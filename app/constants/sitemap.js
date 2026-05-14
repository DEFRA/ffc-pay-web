const HOME = { href: '/', text: 'Home' }

const PAYMENT_HOLDS_LINKS = [
  { href: '/payment-holds', text: 'Manage holds' },
  { href: '/add-payment-hold', text: 'Add payment hold' },
  { href: '/payment-holds/bulk', text: 'Bulk payment holds' },
]

const FINANCE_REPORTS_LINKS = [
  { href: '/report-list', text: 'Reports' },
  { href: '/report-list/payment-requests-v2', text: 'Payment request statuses report' },
  { href: '/report-list/ap-ar-report', text: 'AP/AR listing report' },
  { href: '/report-list/request-editor-report', text: 'Request editor report' },
  { href: '/report-list/status-report', text: 'Payment statement status report' },
]

const PAYMENT_ALERTS_LINKS = [
  { href: '/alerts', text: 'Alerts' },
  { href: '/alerts/information', text: 'Alerts information' },
  { href: '/alerts/update', text: 'Add new alert recipient' },
]

const AGREEMENT_CLOSURES_LINKS = [
  { href: '/closure', text: 'Manage closures' },
  { href: '/closure/add', text: 'Agreement closure' },
  { href: '/closure/bulk', text: 'Bulk agreement closure' },
]

const MONITORING_LINKS = [
  { href: '/monitoring', text: 'Monitoring' },
  { href: '/monitoring/schemes', text: 'Schemes' },
]

const MANUAL_PAYMENTS_LINKS = [
  { href: '/manual-payments', text: 'Manual payment upload' }
]

const RESET_PAYMENT_REQUEST_LINKS = [
  { href: '/payment-request/reset', text: 'Reset payment request' }
]

const METRICS_LINKS = [
  { href: '/metrics', text: 'Management information' }
]

const DOWNLOAD_STATEMENTS_LINKS = [
  { href: '/download-statements', text: 'Download statements' }
]

const HELP_LINKS = [
  { href: '/accessibility', text: 'Accessibility statement' },
  { href: '/cookies', text: 'Cookies' },
  { href: '/privacy', text: 'Privacy' },
]

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Payment holds', links: PAYMENT_HOLDS_LINKS },
  { title: 'Finance reports', links: FINANCE_REPORTS_LINKS },
  { title: 'Payment alerts', links: PAYMENT_ALERTS_LINKS },
  { title: 'Agreement closures', links: AGREEMENT_CLOSURES_LINKS },
  { title: 'Payment event monitoring', links: MONITORING_LINKS },
  { title: 'Manual payment upload', links: MANUAL_PAYMENTS_LINKS },
  { title: 'Reset payment requests', links: RESET_PAYMENT_REQUEST_LINKS },
  { title: 'Management information', links: METRICS_LINKS },
  { title: 'Download statements', links: DOWNLOAD_STATEMENTS_LINKS },
  { title: 'Help', links: HELP_LINKS },
]
