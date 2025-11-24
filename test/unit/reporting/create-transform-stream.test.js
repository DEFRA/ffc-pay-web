const { createTransformStream } = require('../../../app/reporting/create-transform-stream')

jest.mock('../../../app/reporting/mapping/map-and-sanitise', () => ({
  mapAndSanitize: jest.fn((dataRow, fields) => {
    if (dataRow.error) throw new Error('Transform error')
    return { ...dataRow, sanitized: true, fields }
  })
}))

const { mapAndSanitize } = require('../../../app/reporting/mapping/map-and-sanitise')

describe('createTransformStream', () => {
  const dummyFields = ['a', 'b', 'c']
  let onComplete

  beforeEach(() => {
    onComplete = jest.fn().mockResolvedValue()
    mapAndSanitize.mockClear()
    jest.clearAllTimers()
  })

  test.each([
    [{ a: 1, b: 2 }],
    [{ a: 3, b: 4 }]
  ])('transforms row %o correctly', (inputRow, done) => {
    const transformStream = createTransformStream(dummyFields, onComplete)
    const outputRows = []

    transformStream.on('data', row => outputRows.push(row))
    transformStream.on('error', err => done(err))
    transformStream.on('end', () => {
      expect(mapAndSanitize).toHaveBeenCalledTimes(1)
      expect(outputRows[0]).toEqual({ ...inputRow, sanitized: true, fields: dummyFields })
      done()
    })

    transformStream.write(inputRow)
    transformStream.end()
  })

  test('propagates error if mapAndSanitize throws', (done) => {
    const transformStream = createTransformStream(dummyFields, onComplete)
    const badRow = { error: true }

    transformStream.on('error', err => {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('Transform error')
      done()
    })

    transformStream.write(badRow)
  })

  test('flush calls onComplete and logs processing stats', (done) => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    let now = 1000000
    jest.spyOn(global.Date, 'now').mockImplementation(() => now)

    const transformStream = createTransformStream(dummyFields, onComplete)
    const inputRows = [{ a: 1 }, { a: 2 }]
    inputRows.forEach(row => transformStream.write(row))

    now += 65000

    transformStream.end(() => {
      expect(onComplete).toHaveBeenCalled()
      expect(debugSpy).toHaveBeenCalledWith(expect.stringMatching(/Finished processing 2 rows in 1m [0-9]+\.[0-9]s/))
      global.Date.now.mockRestore()
      debugSpy.mockRestore()
      done()
    })
  })
})
