const { retry } = require('../../../../app/messaging/service-bus/retry')

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns result on first successful attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success')

    const resultPromise = retry(fn)
    await jest.runAllTimersAsync()
    const result = await resultPromise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries until successful', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockResolvedValue('success')

    const resultPromise = retry(fn, 5, 100)
    await jest.runAllTimersAsync()
    const result = await resultPromise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('throws last error when all retries exhausted', async () => {
    const lastError = new Error('final failure')
    const fn = jest.fn()
      .mockImplementationOnce(() => { throw new Error('first failure') })
      .mockImplementationOnce(() => { throw new Error('second failure') })
      .mockImplementation(() => { throw lastError })

    const resultPromise = retry(fn, 2, 100)
    const assertion = expect(resultPromise).rejects.toThrow('final failure')
    await jest.runAllTimersAsync()
    await assertion

    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('uses default retry count and interval', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValue('success')

    const resultPromise = retry(fn)
    await jest.runAllTimersAsync()
    await resultPromise

    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('uses linear delay between retries by default', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockResolvedValue('success')

    const resultPromise = retry(fn, 5, 100)
    await jest.advanceTimersByTimeAsync(200)
    const result = await resultPromise

    expect(result).toBe('success')
  })

  test('uses exponential delay between retries when enabled', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockRejectedValueOnce(new Error('third failure'))
      .mockResolvedValue('success')

    const resultPromise = retry(fn, 5, 100, true)
    await jest.advanceTimersByTimeAsync(700)
    const result = await resultPromise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(4)
  })

  test('waits before each retry attempt', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValue('success')

    const resultPromise = retry(fn, 1, 250)

    expect(fn).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(249)
    expect(fn).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)

    const result = await resultPromise
    expect(result).toBe('success')
  })
})
