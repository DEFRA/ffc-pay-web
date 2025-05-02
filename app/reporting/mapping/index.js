const REPORT_TYPES = require('../../constants/report-types')

const { mapAPData, mapARData } = require('./ap-ar')
const { mapRequestEditorData } = require('./request-editor')
const { mapClaimLevelData } = require('./claim-level')

const getDataMapper = reportName => {
  switch (reportName) {
    case REPORT_TYPES.AR_LISTING:
      return mapARData
    case REPORT_TYPES.REQUEST_EDITOR:
      return mapRequestEditorData
    case REPORT_TYPES.CLAIM_LEVEL:
      return mapClaimLevelData
    default:
      return mapAPData
  }
}

module.exports = { getDataMapper }
