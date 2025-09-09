const fs = require('fs')
const { readFileContent } = require('../../../app/helpers/read-file-content')

jest.mock('fs')

describe('read file content', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    fs.readFileSync.mockReturnValue('Mocked file content')
  })

  test('should call readFileSync', async () => {
    readFileContent('made/up/path')
    expect(fs.readFileSync).toHaveBeenCalledWith('made/up/path', 'utf8')
  })

  test('should return output of readFileSync', async () => {
    const result = readFileContent('made/up/path')
    expect(result).toBe('Mocked file content')
  })
})
