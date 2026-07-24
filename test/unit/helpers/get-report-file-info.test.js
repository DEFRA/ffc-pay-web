const { getReportFileInfo } = require('../../../app/helpers/get-report-file-info')

describe('getReportFileInfo', () => {
  test('should return report file metadata', () => {
    const fileInfo = getReportFileInfo()

    expect(fileInfo).toEqual({
      'Payment Holds': {
        fileType: '(CSV)',
        size: 'Variable'
      },
      'Request Editor report': {
        fileType: '(CSV)',
        size: 'Variable'
      },
      'Suppressed payment requests': {
        fileType: '(CSV)',
        size: 'Variable'
      }
    })
  })
})
