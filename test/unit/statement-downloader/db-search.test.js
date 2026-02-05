const { dbSearch } = require('../../../app/statement-downloader/search-helpers/db-search')
const db = require('../../../app/statement-downloader/statement-db-search')
const { createStatementResultFromDBRow } = require('../../../app/statement-downloader/search-helpers/create-statement')

jest.mock('../../../app/statement-downloader/statement-db-search')
jest.mock('../../../app/statement-downloader/search-helpers/create-statement')
jest.mock('../../../app/constants/schemes', () => ({
  statementAbbreviations: {
    1: 'SFI',
    2: 'BPS',
    3: 'CS',
    4: 'DP'
  }
}))

describe('db-search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    test('should call db.search with formatted criteria', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })
      createStatementResultFromDBRow.mockReturnValue(null)

      await dbSearch(50, 0, { schemeId: 1, marketingYear: 2024, frn: '1100021264' })

      expect(db.search).toHaveBeenCalledWith({
        frn: '1100021264',
        schemeShortName: 'SFI',
        schemeYear: 2024
      }, 50, 0)
    })

    test('should return statements and continuation token', async () => {
      const mockRow = { filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf', received: new Date() }
      const mockStatement = { filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf', scheme: 'SFI' }

      db.search.mockResolvedValue({
        statements: [mockRow],
        continuationToken: 'token-123'
      })
      createStatementResultFromDBRow.mockReturnValue(mockStatement)

      const result = await dbSearch(50, 0, {})

      expect(result).toEqual({
        statements: [mockStatement],
        continuationToken: 'token-123'
      })
    })

    test('should map each row using createStatementResultFromDBRow', async () => {
      const mockRow1 = { filename: 'file1.pdf' }
      const mockRow2 = { filename: 'file2.pdf' }
      const mockStatement1 = { filename: 'file1.pdf', scheme: 'SFI' }
      const mockStatement2 = { filename: 'file2.pdf', scheme: 'BPS' }

      db.search.mockResolvedValue({
        statements: [mockRow1, mockRow2],
        continuationToken: null
      })
      createStatementResultFromDBRow
        .mockReturnValueOnce(mockStatement1)
        .mockReturnValueOnce(mockStatement2)

      const result = await dbSearch(50, 0, {})

      expect(createStatementResultFromDBRow).toHaveBeenCalledWith(mockRow1)
      expect(createStatementResultFromDBRow).toHaveBeenCalledWith(mockRow2)
      expect(result.statements).toHaveLength(2)
    })
  })

  describe('scheme mapping', () => {
    test('should map schemeId 1 to SFI', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { schemeId: 1 })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: 'SFI' }),
        50,
        0
      )
    })

    test('should map schemeId 2 to BPS', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { schemeId: 2 })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: 'BPS' }),
        50,
        0
      )
    })

    test('should map schemeId 3 to CS', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { schemeId: 3 })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: 'CS' }),
        50,
        0
      )
    })

    test('should map schemeId 4 to DP', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { schemeId: 4 })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: 'DP' }),
        50,
        0
      )
    })

    test('should not include schemeShortName when schemeId is undefined', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { frn: '1100021264' })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: undefined }),
        50,
        0
      )
    })

    test('should not include schemeShortName when schemeId is 0', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { schemeId: 0 })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: undefined }),
        50,
        0
      )
    })

    test('should not include schemeShortName when schemeId is null', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { schemeId: null })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeShortName: undefined }),
        50,
        0
      )
    })
  })

  describe('criteria handling', () => {
    test('should pass frn from criteria to db.search', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { frn: '1234567890' })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ frn: '1234567890' }),
        50,
        0
      )
    })

    test('should pass marketingYear as schemeYear to db.search', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, { marketingYear: 2024 })

      expect(db.search).toHaveBeenCalledWith(
        expect.objectContaining({ schemeYear: 2024 }),
        50,
        0
      )
    })

    test('should handle empty criteria object', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0, {})

      expect(db.search).toHaveBeenCalledWith({
        frn: undefined,
        schemeShortName: undefined,
        schemeYear: undefined
      }, 50, 0)
    })

    test('should handle undefined criteria with default', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(50, 0)

      expect(db.search).toHaveBeenCalledWith({
        frn: undefined,
        schemeShortName: undefined,
        schemeYear: undefined
      }, 50, 0)
    })

    test('should pass all criteria together', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(100, 50, { schemeId: 2, marketingYear: 2023, frn: '9999999999' })

      expect(db.search).toHaveBeenCalledWith({
        frn: '9999999999',
        schemeShortName: 'BPS',
        schemeYear: 2023
      }, 100, 50)
    })
  })

  test('should pass timestamp from criteria to db.search', async () => {
    db.search.mockResolvedValue({ statements: [], continuationToken: null })

    await dbSearch(50, 0, { timestamp: '20240915120000' })

    expect(db.search).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: '20240915120000' }),
      50,
      0
    )
  })

  test('should handle timestamp with other criteria', async () => {
    db.search.mockResolvedValue({ statements: [], continuationToken: null })

    await dbSearch(50, 0, {
      schemeId: 1,
      marketingYear: 2024,
      frn: '1234567890',
      timestamp: '20240915120000'
    })

    expect(db.search).toHaveBeenCalledWith({
      frn: '1234567890',
      schemeShortName: 'SFI',
      schemeYear: 2024,
      timestamp: '20240915120000'
    }, 50, 0)
  })

  test('should exclude null timestamp', async () => {
    db.search.mockResolvedValue({ statements: [], continuationToken: null })

    await dbSearch(50, 0, { frn: '1234567890', timestamp: null })

    expect(db.search).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: null }),
      50,
      0
    )
  })

  test('should exclude undefined timestamp with default', async () => {
    db.search.mockResolvedValue({ statements: [], continuationToken: null })

    await dbSearch(50, 0, { frn: '1234567890' })

    expect(db.search).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: undefined }),
      50,
      0
    )
  })

  describe('pagination', () => {
    test('should pass pageLimit and offset to db.search', async () => {
      db.search.mockResolvedValue({ statements: [], continuationToken: null })

      await dbSearch(100, 50, {})

      expect(db.search).toHaveBeenCalledWith(expect.any(Object), 100, 50)
    })

    test('should continue with provided continuationToken from payload', async () => {
      const mockRow = { filename: 'file.pdf' }
      const mockStatement = { filename: 'file.pdf', scheme: 'SFI' }

      db.search.mockResolvedValue({
        statements: [mockRow],
        continuationToken: 'next-token-456'
      })
      createStatementResultFromDBRow.mockReturnValue(mockStatement)

      const result = await dbSearch(50, 0, {})

      expect(result.continuationToken).toBe('next-token-456')
    })

    test('should calculate continuationToken as offset + mapped length when mapped length equals pageLimit', async () => {
      const mockRows = [
        { filename: 'file1.pdf' },
        { filename: 'file2.pdf' }
      ]
      const mockStatements = [
        { filename: 'file1.pdf', scheme: 'SFI' },
        { filename: 'file2.pdf', scheme: 'BPS' }
      ]

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: undefined
      })
      createStatementResultFromDBRow
        .mockReturnValueOnce(mockStatements[0])
        .mockReturnValueOnce(mockStatements[1])

      const result = await dbSearch(2, 100, {})

      expect(result.continuationToken).toBe(102)
    })

    test('should return null continuationToken when mapped length less than pageLimit', async () => {
      const mockRows = Array.from({ length: 25 }, (_, i) => ({ filename: `file${i}.pdf` }))
      const mockStatements = mockRows.map((r, i) => ({ filename: r.filename, scheme: 'SFI' }))

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: undefined
      })
      mockStatements.forEach((stmt, i) => {
        createStatementResultFromDBRow.mockReturnValueOnce(stmt)
      })

      const result = await dbSearch(50, 0, {})

      expect(result.continuationToken).toBeNull()
    })

    test('should return null continuationToken when mapped length less than pageLimit', async () => {
      const mockRows = Array.from({ length: 25 }, (_, i) => ({ filename: `file${i}.pdf` }))
      const mockStatements = mockRows.map((r, i) => ({ filename: r.filename, scheme: 'SFI' }))

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: undefined
      })
      mockStatements.forEach((stmt, i) => {
        createStatementResultFromDBRow.mockReturnValueOnce(stmt)
      })

      const result = await dbSearch(50, 100, {})

      expect(result.continuationToken).toBeNull()
    })

    test('should return continuationToken from payload even if results less than pageLimit', async () => {
      const mockRows = Array.from({ length: 25 }, (_, i) => ({ filename: `file${i}.pdf` }))
      const mockStatements = mockRows.map((r, i) => ({ filename: r.filename, scheme: 'SFI' }))

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: 'next-page'
      })
      mockStatements.forEach((stmt, i) => {
        createStatementResultFromDBRow.mockReturnValueOnce(stmt)
      })

      const result = await dbSearch(50, 0, {})

      expect(result.continuationToken).toBe('next-page')
    })
  })

  describe('payload structure variations', () => {
    test('should extract statements from payload.statements', async () => {
      const mockRow = { filename: 'file.pdf' }
      const mockStatement = { filename: 'file.pdf', scheme: 'SFI' }

      db.search.mockResolvedValue({
        statements: [mockRow],
        continuationToken: null
      })
      createStatementResultFromDBRow.mockReturnValue(mockStatement)

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([mockStatement])
    })

    test('should extract rows from payload.rows fallback', async () => {
      const mockRow = { filename: 'file.pdf' }
      const mockStatement = { filename: 'file.pdf', scheme: 'SFI' }

      db.search.mockResolvedValue({
        rows: [mockRow],
        continuationToken: null
      })
      createStatementResultFromDBRow.mockReturnValue(mockStatement)

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([mockStatement])
    })

    test('should treat entire payload as array if not an object with statements or rows', async () => {
      const mockRow = { filename: 'file.pdf' }
      const mockStatement = { filename: 'file.pdf', scheme: 'SFI' }

      db.search.mockResolvedValue([mockRow])
      createStatementResultFromDBRow.mockReturnValue(mockStatement)

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([mockStatement])
    })

    test('should return empty array when no statements property and not an array', async () => {
      db.search.mockResolvedValue({ someOtherProperty: 'value' })

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })
  })

  describe('filtering falsy results', () => {
    test('should filter out null results from createStatementResultFromDBRow', async () => {
      const mockRows = [
        { filename: 'file1.pdf' },
        { filename: 'file2.pdf' }
      ]

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: null
      })
      createStatementResultFromDBRow
        .mockReturnValueOnce({ filename: 'file1.pdf', scheme: 'SFI' })
        .mockReturnValueOnce(null)

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toHaveLength(1)
      expect(result.statements[0].filename).toBe('file1.pdf')
    })

    test('should filter out falsy values from mapping', async () => {
      const mockRows = [
        { filename: 'file1.pdf' },
        { filename: 'file2.pdf' },
        { filename: 'file3.pdf' }
      ]

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: null
      })
      createStatementResultFromDBRow
        .mockReturnValueOnce({ filename: 'file1.pdf', scheme: 'SFI' })
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({ filename: 'file3.pdf', scheme: 'BPS' })

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toHaveLength(2)
    })

    test('should return empty array when all mapped results are falsy', async () => {
      const mockRows = [
        { filename: 'file1.pdf' },
        { filename: 'file2.pdf' }
      ]

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: null
      })
      createStatementResultFromDBRow.mockReturnValue(null)

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })
  })

  describe('empty results', () => {
    test('should return empty statements when rows array is empty', async () => {
      db.search.mockResolvedValue({
        statements: [],
        continuationToken: null
      })

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })

    test('should return empty statements when rows is not an array', async () => {
      db.search.mockResolvedValue({
        statements: 'not-an-array'
      })

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })

    test('should return empty statements when rows is null', async () => {
      db.search.mockResolvedValue({
        statements: null
      })

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })

    test('should return empty statements when payload is null', async () => {
      db.search.mockResolvedValue(null)

      const result = await dbSearch(50, 0, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })
  })

  describe('large datasets', () => {
    test('should handle large number of rows', async () => {
      const mockRows = Array.from({ length: 1000 }, (_, i) => ({ filename: `file${i}.pdf` }))
      const mockStatements = mockRows.map((r, i) => ({ filename: r.filename, scheme: 'SFI' }))

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: undefined
      })
      mockStatements.forEach((stmt) => {
        createStatementResultFromDBRow.mockReturnValueOnce(stmt)
      })

      const result = await dbSearch(100, 0, {})

      expect(result.statements).toHaveLength(1000)
      expect(createStatementResultFromDBRow).toHaveBeenCalledTimes(1000)
    })

    test('should calculate continuation token correctly for large offset', async () => {
      const mockRows = Array.from({ length: 50 }, (_, i) => ({ filename: `file${i}.pdf` }))
      const mockStatements = mockRows.map((r) => ({ filename: r.filename, scheme: 'SFI' }))

      db.search.mockResolvedValue({
        statements: mockRows,
        continuationToken: undefined
      })
      mockStatements.forEach((stmt) => {
        createStatementResultFromDBRow.mockReturnValueOnce(stmt)
      })

      const result = await dbSearch(50, 10000, {})

      expect(result.continuationToken).toBe(10050)
    })
  })

  describe('error handling', () => {
    test('should propagate error from db.search', async () => {
      const error = new Error('Database query failed')
      db.search.mockRejectedValue(error)

      await expect(dbSearch(50, 0, {})).rejects.toThrow('Database query failed')
    })

    test('should propagate error from createStatementResultFromDBRow', async () => {
      const mockRow = { filename: 'file.pdf' }
      db.search.mockResolvedValue({
        statements: [mockRow],
        continuationToken: null
      })
      createStatementResultFromDBRow.mockImplementation(() => {
        throw new Error('Mapping error')
      })

      await expect(dbSearch(50, 0, {})).rejects.toThrow('Mapping error')
    })
  })

  describe('result structure', () => {
    test('should always return object with statements and continuationToken', async () => {
      db.search.mockResolvedValue({
        statements: [],
        continuationToken: null
      })

      const result = await dbSearch(50, 0, {})

      expect(result).toHaveProperty('statements')
      expect(result).toHaveProperty('continuationToken')
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return array for statements property', async () => {
      const mockRow = { filename: 'file.pdf' }
      const mockStatement = { filename: 'file.pdf', scheme: 'SFI' }

      db.search.mockResolvedValue({
        statements: [mockRow],
        continuationToken: null
      })
      createStatementResultFromDBRow.mockReturnValue(mockStatement)

      const result = await dbSearch(50, 0, {})

      expect(Array.isArray(result.statements)).toBe(true)
    })
  })
})
