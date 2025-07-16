const { getContainerClient } = require('./container-manager')
const config = require('../config').storageConfig

const REPORT_TYPE_PREFIXES = [
  'sustainable-farming-incentive-',
  'delinked-payment-statement-'
]

// Helper to strip the virtual folder
const stripReportsFolder = (blobName) =>
  blobName.startsWith('reports/') ? blobName.slice('reports/'.length) : blobName

const getValidReportYears = async () => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const yearTypeSet = new Set()

  for await (const blob of statementsContainer.listBlobsFlat()) {
    const rawName = stripReportsFolder(blob.name)

    const prefix = REPORT_TYPE_PREFIXES.find(p => rawName.startsWith(p))
    if (!prefix) continue

    const datePart = rawName
      .replace(prefix, '')
      .replace('.csv', '')
      .replace(/_/g, ':')

    const reportDate = new Date(datePart)
    if (isNaN(reportDate.getTime())) continue

    const year = reportDate.getFullYear()
    const type = prefix.replace(/-$/, '')

    yearTypeSet.add(JSON.stringify({ year, type }))
  }

  return Array.from(yearTypeSet)
    .map(entry => JSON.parse(entry))
    .sort((a, b) => b.year - a.year)
}

const getReportsByYearAndType = async (year, type) => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const rawPrefix = REPORT_TYPE_PREFIXES.find(p => p.startsWith(type))
  if (!rawPrefix) return []

  const reports = []
  for await (const blob of statementsContainer.listBlobsFlat()) {
    const rawName = stripReportsFolder(blob.name)
    if (!rawName.startsWith(rawPrefix)) continue

    const datePart = rawName.replace(rawPrefix, '').replace('.csv', '')
    const reportDate = new Date(datePart)
    if (isNaN(reportDate.getTime()) || reportDate.getFullYear() !== Number(year)) continue

    reports.push({
      name: blob.name,
      date: reportDate,
      type
    })
  }

  return reports
}

const getStatusReport = async (reportName) => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const blob = await statementsContainer.getBlockBlobClient(reportName)
  return blob.download()
}

module.exports = {
  getValidReportYears,
  getReportsByYearAndType,
  getStatusReport
}
