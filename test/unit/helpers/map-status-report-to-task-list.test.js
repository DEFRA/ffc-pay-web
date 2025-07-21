jest.mock('../../../app/constants/report-list', () => ({
  STATUS_DOWNLOAD: '/status-report/download'
}))

const { mapStatusReportsToTaskList } = require('../../../app/helpers/map-status-report-to-task-list')

describe('mapStatusReportsToTaskList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('maps reports to formatted task list items', () => {
    const inputReports = [
      { name: 'report-1.csv', date: '2024-07-01T12:00:00Z' },
      { name: 'report-2.csv', date: '2025-01-15T09:30:00Z' }
    ]

    const result = mapStatusReportsToTaskList(inputReports)

    expect(result).toEqual([
      {
        title: { text: '01 July 2024' },
        href: '/status-report/download?file-name=report-1.csv'
      },
      {
        title: { text: '15 January 2025' },
        href: '/status-report/download?file-name=report-2.csv'
      }
    ])
  })

  test('encodes special characters in file names', () => {
    const inputReports = [
      { name: 'file with spaces.csv', date: '2025-05-05T00:00:00Z' }
    ]

    const result = mapStatusReportsToTaskList(inputReports)

    expect(result[0].href).toBe('/status-report/download?file-name=file%20with%20spaces.csv')
  })

  test('returns empty array when input is empty', () => {
    const result = mapStatusReportsToTaskList([])
    expect(result).toEqual([])
  })
})
