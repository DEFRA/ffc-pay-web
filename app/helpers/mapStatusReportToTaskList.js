const REPORT_LIST = require('../constants/report-list')

const mapStatusReportsToTaskList = (reports) => {
  return reports.map(({ name, date }) => {
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    return {
      title: { text: formattedDate },
      href: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=${encodeURIComponent(name)}`
    }
  })
}

module.exports = {
  mapStatusReportsToTaskList
}
