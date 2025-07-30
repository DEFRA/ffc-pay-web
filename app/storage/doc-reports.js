const { getContainerClient } = require('./container-manager')
const config = require('../config').storageConfig

const REPORT_TYPE_PREFIXES = [
  config.sfiStatusReport.replace('.csv', '-'),
  config.delinkedStatusReport.replace('.csv', '-')
]

const stripReportsFolder = (blobName) =>
  blobName.startsWith(config.statusReportsFolder) ? blobName.replace(`${config.statusReportsFolder}/`, '') : blobName

const getValidReportYearsByType = async () => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const yearTypeSet = new Set()

  for await (const { name } of statementsContainer.listBlobsFlat({ prefix: config.statusReportsFolder })) {
    const rawName = stripReportsFolder(name)
    const prefix = REPORT_TYPE_PREFIXES.find(p => rawName.startsWith(p))

    if (prefix) {
      const datePart = rawName
        .replace(prefix, '')
        .replace('.csv', '')
        .replace(/_/g, ':')

      const reportDate = new Date(datePart)
      console.log('reportDate', reportDate, 'datePart', datePart)
      if (!isNaN(reportDate.getTime())) {
        const year = reportDate.getFullYear()
        const type = prefix.replace(/-$/, '')
        yearTypeSet.add(JSON.stringify({ year, type }))
      }
    }
  }

  return Array.from(yearTypeSet)
    .map(entry => JSON.parse(entry))
    .sort((a, b) => b.year - a.year)
}

const getReportsByYearAndType = async (year, type) => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const rawPrefix = REPORT_TYPE_PREFIXES.find(p => p.startsWith(type))

  if (!rawPrefix) {
    return []
  }

  const reports = []
  for await (const { name } of statementsContainer.listBlobsFlat({ prefix: config.statusReportsFolder })) {
    const rawName = stripReportsFolder(name)

    if (rawName.startsWith(rawPrefix)) {
      const datePart = rawName.replace(rawPrefix, '').replace('.csv', '')
      const reportDate = new Date(datePart)

      if (!isNaN(reportDate.getTime()) && reportDate.getFullYear() === Number(year)) {
        reports.push({
          name,
          date: reportDate,
          type
        })
      }
    }
  }

  return reports
}

const getStatusReport = async (reportName) => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const blob = await statementsContainer.getBlockBlobClient(reportName)
  return blob.download()
}

module.exports = {
  getValidReportYearsByType,
  getReportsByYearAndType,
  getStatusReport
}
