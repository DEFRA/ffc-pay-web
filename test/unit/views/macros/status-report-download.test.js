describe('status-report-download macro', () => {
  test('macro file exists and is correctly structured', () => {
    const fs = require('fs')
    const path = require('path')

    const macroPath = path.join(__dirname, '../../../../app/views/macros/status-report-download.njk')
    const content = fs.readFileSync(macroPath, 'utf-8')

    expect(content).toContain('renderStatusReportDownloadSuccessBanner')
    expect(content).toContain('govukNotificationBanner')
    expect(content).toContain('Download complete')
    expect(content).toContain('type: "success"')
  })
})
