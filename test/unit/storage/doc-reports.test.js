const { getValidReportYears, getReportsByYearAndType, getStatusReport } = require('../../../app/storage/doc-reports')
const { getContainerClient } = require('../../../app/storage/container-manager')

jest.mock('../../../app/config', () => ({
  storageConfig: {
    statusReportsFolder: 'reports',
    sfiStatusReport: 'sfi-status.csv',
    delinkedStatusReport: 'delinked-status.csv',
    statementsContainer: 'mock-container'
  }
}))

jest.mock('../../../app/storage/container-manager')

describe('status-reports', () => {
  let listBlobsFlatMock
  let getBlockBlobClientMock
  let containerMock

  beforeEach(() => {
    listBlobsFlatMock = jest.fn()
    getBlockBlobClientMock = jest.fn()
    containerMock = {
      listBlobsFlat: listBlobsFlatMock,
      getBlockBlobClient: getBlockBlobClientMock
    }
    getContainerClient.mockResolvedValue(containerMock)
  })

  afterEach(() => jest.clearAllMocks())

  describe('getValidReportYears', () => {
    test('returns sorted list of valid years and types', async () => {
      const blobNames = [
        'reports/sfi-status-2022-01-01.csv',
        'reports/sfi-status-2023-02-01.csv',
        'reports/delinked-status-2023-05-01.csv',
        'reports/invalid-status-2024-01-01.csv',
        'other-folder/sfi-status-2020-01-01.csv'
      ]
      listBlobsFlatMock.mockReturnValue((async function * () {
        for (const name of blobNames) yield { name }
      })())

      const result = await getValidReportYears()

      expect(result).toEqual([
        { year: 2023, type: 'sfi-status' },
        { year: 2023, type: 'delinked-status' },
        { year: 2022, type: 'sfi-status' }
      ])
    })
  })

  describe('getReportsByYearAndType', () => {
    test('returns reports matching year and type', async () => {
      const year = 2023
      const type = 'sfi-status'
      const prefix = `${type}-`

      const blobNames = [
        `reports/${prefix}2023-01-01.csv`,
        `reports/${prefix}2022-01-01.csv`,
        'reports/delinked-status-2023-05-01.csv'
      ]

      listBlobsFlatMock.mockReturnValue((async function * () {
        for (const name of blobNames) yield { name }
      })())

      const reports = await getReportsByYearAndType(year, type)

      expect(reports).toHaveLength(1)
      expect(reports[0].name).toBe(`reports/${prefix}2023-01-01.csv`)
      expect(reports[0].date.getFullYear()).toBe(2023)
      expect(reports[0].type).toBe(type)
    })

    test('returns empty list if type is unknown', async () => {
      const reports = await getReportsByYearAndType(2023, 'unknown-type')
      expect(reports).toEqual([])
    })
  })

  describe('getStatusReport', () => {
    test('downloads the correct blob', async () => {
      const reportName = 'reports/sfi-status-2023-01-01.csv'
      const downloadMock = jest.fn()
      getBlockBlobClientMock.mockReturnValue({ download: downloadMock })

      await getStatusReport(reportName)

      expect(getContainerClient).toHaveBeenCalledWith('mock-container')
      expect(getBlockBlobClientMock).toHaveBeenCalledWith(reportName)
      expect(downloadMock).toHaveBeenCalled()
    })
  })
})
