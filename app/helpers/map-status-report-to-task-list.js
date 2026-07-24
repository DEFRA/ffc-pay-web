const GENERATE_REPORT_LIST = require('../constants/generate-report-list')

const mapStatusReportsToTaskList = (reports) => {
  return reports.map(({ name, date }) => {
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    return {
      title: { text: formattedDate },
      href: `${GENERATE_REPORT_LIST.STATUS_DOWNLOAD}?file-name=${encodeURIComponent(name)}`
    }
  })
}

module.exports = {
  mapStatusReportsToTaskList
}
