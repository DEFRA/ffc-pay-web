const { createStatementResultFromService, apiBlobSearch } = require('../../../app/statement-downloader/search-helpers/api-blob-search')

jest.mock('../../../app/statement-downloader/statement-db-search', () => ({
  search: jest.fn()
}))
jest.mock('../../../app/statement-downloader/search-helpers/get-statement-parts', () => ({
  getStatementsContainer: jest.fn()
}))
jest.mock('../../../app/constants/schemes', () => ({
  statementAbbreviations: {
    1: 'DP',
    2: 'SFI'
  }
}))

const mockDbSearch = require('../../../app/statement-downloader/statement-db-search').search
const mockGetStatementsContainer = require('../../../app/statement-downloader/search-helpers/get-statement-parts').getStatementsContainer
const originalConsoleWarn = console.warn
beforeAll(() => {
  console.warn = jest.fn()
})
afterAll(() => {
  console.warn = originalConsoleWarn
})

describe('createStatementResultFromService', () => {
  test('should return formatted result with valid statement and downloadResponse', () => {
    const statement = {
      filename: 'test.pdf',
      schemeId: 1,
      marketingYear: 2023,
      frn: 1234567890,
      timestamp: '2023101508224868',
      received: '2023-10-15T08:22:48.000Z'
    }
    const downloadResponse = {
      contentLength: 1024,
      lastModified: '2023-10-15T08:22:48.000Z'
    }

    const result = createStatementResultFromService(statement, downloadResponse)

    expect(result).toEqual({
      filename: 'test.pdf',
      scheme: 'DP',  // Mapped from schemeId 1
      year: '2023',
      frn: '1234567890',
      timestamp: '2023101508224868',
      size: 1024,
      lastModified: '2023-10-15T08:22:48.000Z',
      statementId: null
    })
  })

  test('should handle missing downloadResponse and use statement.received', () => {
    const statement = {
      filename: 'test.pdf',
      schemeId: 2,
      marketingYear: 2024,
      frn: 9876543210,
      timestamp: '2024101508224868',
      received: '2024-10-15T08:22:48.000Z'
    }

    const result = createStatementResultFromService(statement)

    expect(result).toEqual({
      filename: 'test.pdf',
      scheme: 'SFI',  // Mapped from schemeId 2
      year: '2024',
      frn: '9876543210',
      timestamp: '2024101508224868',
      size: null,
      lastModified: '2024-10-15T08:22:48.000Z',
      statementId: null
    })
  })

  test('should return null if statement.filename is missing', () => {
    const statement = { schemeId: 1 }
    const result = createStatementResultFromService(statement)
    expect(result).toBeNull()
  })

  test('should fallback to schemeId if not in statementAbbreviations', () => {
    const statement = {
      filename: 'test.pdf',
      schemeId: 999,  // Not in mock abbreviations
      marketingYear: 2023
    }
    const result = createStatementResultFromService(statement)
    expect(result.scheme).toBe(999)
  })

  test('should handle null/undefined fields gracefully', () => {
    const statement = {
      filename: 'test.pdf',
      schemeId: 1,
      marketingYear: null,
      frn: undefined,
      timestamp: null
    }
    const result = createStatementResultFromService(statement)
    expect(result).toEqual({
      filename: 'test.pdf',
      scheme: 'DP',
      year: undefined,
      frn: undefined,
      timestamp: null,
      size: null,
      lastModified: null,
      statementId: null
    })
  })
})

describe('apiBlobSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return statements with successful downloads', async () => {
    const criteria = { schemeId: 1, marketingYear: 2023 }
    const serviceResponse = {
      statements: [
        {
          filename: 'test1.pdf',
          schemeId: 1,
          marketingYear: 2023,
          frn: 1234567890,
          timestamp: '2023101508224868'
        }
      ],
      continuationToken: '10'
    }
    const mockContainer = {
      getBlobClient: jest.fn().mockReturnValue({
        download: jest.fn().mockResolvedValue({
          contentLength: 1024,
          lastModified: '2023-10-15T08:22:48.000Z'
        })
      })
    }

    mockDbSearch.mockResolvedValue(serviceResponse)
    mockGetStatementsContainer.mockResolvedValue(mockContainer)

    const result = await apiBlobSearch(10, '5', criteria)

    expect(mockDbSearch).toHaveBeenCalledWith(
      { schemeshortname: 'DP', marketingYear: 2023 },  // schemeId mapped to abbrev
      10,
      5
    )
    expect(mockGetStatementsContainer).toHaveBeenCalled()
    expect(mockContainer.getBlobClient).toHaveBeenCalledWith('test1.pdf')
    expect(result).toEqual({
      statements: [
        {
          filename: 'test1.pdf',
          scheme: 'DP',
          year: '2023',
          frn: '1234567890',
          timestamp: '2023101508224868',
          size: 1024,
          lastModified: '2023-10-15T08:22:48.000Z',
          statementId: null
        }
      ],
      continuationToken: '10'
    })
  })

  test('should return empty results if no statements from service', async () => {
    mockDbSearch.mockResolvedValue({ statements: [], continuationToken: null })

    const result = await apiBlobSearch(10, null, {})

    expect(result).toEqual({ statements: [], continuationToken: null })
    expect(mockGetStatementsContainer).not.toHaveBeenCalled()
  })

  test('should handle continuationToken as number', async () => {
    mockDbSearch.mockResolvedValue({ statements: [], continuationToken: null })

    await apiBlobSearch(10, '20', {})

    expect(mockDbSearch).toHaveBeenCalledWith({}, 10, 20)
  })

  test('should skip failed downloads and log warning', async () => {
    const serviceResponse = {
      statements: [
        { filename: 'good.pdf', schemeId: 1 },
        { filename: 'bad.pdf', schemeId: 1 }
      ],
      continuationToken: null
    }
    const mockContainer = {
      getBlobClient: jest.fn()
        .mockReturnValueOnce({
          download: jest.fn().mockResolvedValue({ contentLength: 512 })
        })
        .mockReturnValueOnce({
          download: jest.fn().mockRejectedValue(new Error('Download failed'))
        })
    }

    mockDbSearch.mockResolvedValue(serviceResponse)
    mockGetStatementsContainer.mockResolvedValue(mockContainer)

    const result = await apiBlobSearch(10, null, { schemeId: 1 })

    expect(result.statements).toHaveLength(1)  // Only successful download
    expect(result.statements[0].filename).toBe('good.pdf')
    expect(console.warn).toHaveBeenCalledWith('Failed to download bad.pdf:', 'Download failed')
  })

  test('should handle dbSearch rejection', async () => {
    mockDbSearch.mockRejectedValue(new Error('Service error'))

    await expect(apiBlobSearch(10, null, {})).rejects.toThrow('Service error')
  })

  test('should not modify criteria if schemeId is missing', async () => {
    const criteria = { marketingYear: 2023 }
    mockDbSearch.mockResolvedValue({ statements: [], continuationToken: null })

    await apiBlobSearch(10, null, criteria)

    expect(mockDbSearch).toHaveBeenCalledWith({ marketingYear: 2023 }, 10, 0)
  })
})
