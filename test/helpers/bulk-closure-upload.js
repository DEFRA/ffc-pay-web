const getCrumbs = require('./get-crumbs')

const BULK_URL = '/closure/bulk'
const BOUNDARY = 'closure-upload-boundary'
const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF])

const buildClosureCsv = (rows, { bom = false } = {}) => {
  const body = Buffer.from(rows.map(row => row.join(',')).join('\r\n') + '\r\n', 'utf8')
  return bom ? Buffer.concat([UTF8_BOM, body]) : body
}

const buildMultipartPayload = (crumb, fileContents, filename) => Buffer.concat([
  Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="crumb"\r\n\r\n${crumb}\r\n`),
  Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/csv\r\n\r\n`),
  fileContents,
  Buffer.from(`\r\n--${BOUNDARY}--\r\n`)
])

const uploadClosureCsv = async (server, auth, fileContents, filename = 'bulkClosureUpload.csv') => {
  const { cookieCrumb, viewCrumb } = await getCrumbs(() => {}, server, BULK_URL, auth)

  return server.inject({
    method: 'POST',
    url: BULK_URL,
    payload: buildMultipartPayload(viewCrumb, fileContents, filename),
    headers: {
      cookie: `crumb=${cookieCrumb}`,
      'content-type': `multipart/form-data; boundary=${BOUNDARY}`
    },
    auth
  })
}

module.exports = {
  UTF8_BOM,
  buildClosureCsv,
  uploadClosureCsv
}
