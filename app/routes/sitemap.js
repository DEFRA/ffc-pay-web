const ViewModel = require('./models/sitemap')

module.exports = {
  method: 'GET',
  path: '/sitemap',
  options: {
    handler: (request, h) => {
      const sections = [
        {
          title: '',
          links: [
            { href: '/', text: 'Home' }
          ]
        },
        {
          title: 'Payment holds',
          links: [
            { href: '/payment-holds', text: 'Manage holds' },
            { href: '/add-payment-hold', text: 'Add payment hold' },
            { href: '/payment-holds/bulk', text: 'Bulk payment holds' },
          ]
        },
        {
          title: 'Finance reports',
          links: [
            { href: '/report-list', text: 'Reports' },
            { href: '/report-list/payment-requests-v2', text: 'Payment Request Statuses Report' },
            { href: '/report-list/ap-ar-report', text: 'AP/AR Listing Report' },
            { href: '/report-list/request-editor-report', text: 'Request Editor report' },
            { href: '/report-list/status-report', text: 'Payment statement status report' }
          ]
        },
        {
          title: 'Payment alerts',
          links: [
            { href: '/alerts', text: 'Alerts' },
            { href: '/alerts/information', text: 'Alerts information' },
            { href: '/alerts/update', text: 'Add new alert recipient' }
          ]
        },
        {
          title: 'Agreement closures',
          links: [
            { href: '/closure', text: 'Manage closures' },
            { href: '/closure/add', text: 'Agreement closure' },
            { href: '/closure/bulk', text: 'Bulk agreement closure' }
          ]
        },
        {
          title: 'Payment event monitoring',
          links: [
            { href: '/monitoring', text: 'Monitoring' },
            { href: '/monitoring/schemes', text: 'Schemes' }
          ]
        },
        {
          title: 'Manual payment upload',
          links: [
            { href: '/manual-payments', text: 'Manual payment upload' }
          ]
        },
        {
          title: 'Reset payment requests',
          links: [
            { href: '/payment-request/reset', text: 'Reset payment request' }
          ]
        },
        {
          title: 'Management Information',
          links: [
            { href: '/metrics', text: 'Management Information' }
          ]
        },
        {
          title: 'Download Statements',
          links: [
            { href: '/download-statements', text: 'Download Statements' }
          ]
        },
        {
          title: 'Help',
          links: [
            { href: '/accessibility', text: 'Accessibility statement' },
            { href: '/cookies', text: 'Cookies' },
            { href: '/privacy', text: 'Privacy' }
          ]
        }
      ]

      return h.view('sitemap', new ViewModel(sections))
    }
  }
}
