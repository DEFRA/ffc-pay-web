const { createStatementResult, createStatementResultFromDBRow } = require('../../../app/statement-downloader/search-helpers/create-statement')
const { parseFilename } = require('../../../app/statement-downloader/search-helpers/get-statement-parts')

jest.mock('../../../app/statement-downloader/search-helpers/get-statement-parts')

describe('create-statement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createStatementResult', () => {
    test('should extract filename and map blob properties to statement object', () => {
      const blob = {
        name: 'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        properties: {
          contentLength: 1024,
          lastModified: new Date('2024-09-15')
        }
      }
      const parsed = {
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '20240915120000'
      }

      const result = createStatementResult(blob, parsed)

      expect(result.filename).toBe('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')
      expect(result.scheme).toBe('SFI')
      expect(result.size).toBe(1024)
      expect(result.lastModified).toEqual(new Date('2024-09-15'))
    })

    test('should handle missing contentLength with null fallback', () => {
      const blob = {
        name: 'outbound/statement.pdf',
        properties: { lastModified: new Date() }
      }
      const parsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }

      const result = createStatementResult(blob, parsed)

      expect(result.size).toBeNull()
    })

    test('should handle missing lastModified with null fallback', () => {
      const blob = {
        name: 'outbound/statement.pdf',
        properties: { contentLength: 1024 }
      }
      const parsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }

      const result = createStatementResult(blob, parsed)

      expect(result.lastModified).toBeNull()
    })

    test('should handle undefined properties object', () => {
      const blob = {
        name: 'outbound/statement.pdf',
        properties: undefined
      }
      const parsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }

      const result = createStatementResult(blob, parsed)

      expect(result.size).toBeNull()
      expect(result.lastModified).toBeNull()
    })

    test('should extract only filename from blob path with multiple slashes', () => {
      const blob = {
        name: 'outbound/2024/09/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        properties: { contentLength: 1024, lastModified: new Date() }
      }
      const parsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }

      const result = createStatementResult(blob, parsed)

      expect(result.filename).toBe('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')
    })

    test('should return object with all expected properties', () => {
      const blob = {
        name: 'outbound/statement.pdf',
        properties: { contentLength: 1024, lastModified: new Date() }
      }
      const parsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }

      const result = createStatementResult(blob, parsed)

      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('scheme')
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('frn')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('size')
      expect(result).toHaveProperty('lastModified')
    })
  })

  describe('createStatementResultFromDBRow', () => {
    test('should parse valid row and use parsed filename data', () => {
      const row = {
        filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        schemeshortname: 'SFI',
        schemeyear: 2024,
        frn: 1100021264,
        statementid: 'stmt-123',
        received: new Date('2024-09-15')
      }
      parseFilename.mockReturnValue({
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '20240915120000'
      })

      const result = createStatementResultFromDBRow(row)

      expect(result.filename).toBe('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')
      expect(result.scheme).toBe('SFI')
      expect(result.timestamp).toBe('20240915120000')
      expect(result.lastModified).toEqual(new Date('2024-09-15'))
      expect(result.statementId).toBe('stmt-123')
    })

    test('should return null for row without filename', () => {
      const result = createStatementResultFromDBRow({ schemeshortname: 'SFI' })

      expect(result).toBeNull()
    })

    test('should return null for null row', () => {
      const result = createStatementResultFromDBRow(null)

      expect(result).toBeNull()
    })

    test('should fallback to DB row data when parseFilename returns null', () => {
      const row = {
        filename: 'invalid.pdf',
        schemeshortname: 'BPS',
        schemeyear: 2023,
        frn: 1234567890,
        statementid: 'stmt-456',
        received: new Date('2025-01-15')
      }
      parseFilename.mockReturnValue(null)

      const result = createStatementResultFromDBRow(row)

      expect(result.scheme).toBe('BPS')
      expect(result.year).toBe('2023')
      expect(result.frn).toBe('1234567890')
      expect(result.timestamp).toBeNull()
      expect(result.lastModified).toEqual(new Date('2025-01-15'))
    })

    test('should convert DB row numbers to strings', () => {
      const row = {
        filename: 'invalid.pdf',
        schemeshortname: 'CS',
        schemeyear: 2024,
        frn: 5555555555,
        statementid: 'stmt-789',
        received: new Date()
      }
      parseFilename.mockReturnValue(null)

      const result = createStatementResultFromDBRow(row)

      expect(result.year).toBe('2024')
      expect(result.frn).toBe('5555555555')
      expect(typeof result.year).toBe('string')
      expect(typeof result.frn).toBe('string')
    })

    test('should always set size to null for DB rows', () => {
      const row = {
        filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        schemeshortname: 'SFI',
        schemeyear: 2024,
        frn: 1100021264,
        statementid: 'stmt-123',
        received: new Date()
      }
      parseFilename.mockReturnValue({ scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' })

      const result = createStatementResultFromDBRow(row)

      expect(result.size).toBeNull()
    })

    test('should call parseFilename with row filename', () => {
      const row = {
        filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        schemeshortname: 'SFI',
        schemeyear: 2024,
        frn: 1100021264,
        statementid: 'stmt-123',
        received: new Date()
      }
      parseFilename.mockReturnValue({ scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' })

      createStatementResultFromDBRow(row)

      expect(parseFilename).toHaveBeenCalledWith('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')
    })

    test('should handle missing received property', () => {
      const row = {
        filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        schemeshortname: 'SFI',
        schemeyear: 2024,
        frn: 1100021264,
        statementid: 'stmt-123'
      }
      parseFilename.mockReturnValue({ scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' })

      const result = createStatementResultFromDBRow(row)

      expect(result.lastModified).toBeNull()
    })

    test('should return object with all expected properties', () => {
      const row = {
        filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf',
        schemeshortname: 'SFI',
        schemeyear: 2024,
        frn: 1100021264,
        statementid: 'stmt-123',
        received: new Date()
      }
      parseFilename.mockReturnValue({ scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' })

      const result = createStatementResultFromDBRow(row)

      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('scheme')
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('frn')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('size')
      expect(result).toHaveProperty('lastModified')
      expect(result).toHaveProperty('statementId')
    })
  })
})
