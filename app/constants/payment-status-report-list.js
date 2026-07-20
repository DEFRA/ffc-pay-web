const buildDownload = (path) => `${path}/download`

const basePaths = {
  STATUS: '/status-report',
  STATUS_SEARCH: '/status-report/search'
}

module.exports = {
  ...basePaths,
  STATUS_DOWNLOAD: buildDownload(basePaths.STATUS),
  STATUS_DOWNLOAD_PREPARE: `${buildDownload(basePaths.STATUS)}/prepare`
}
