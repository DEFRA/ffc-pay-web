const createServer = require('../../app/server')

jest.mock('../../app/insights', () => ({
  setup: jest.fn()
}))
jest.mock('../../app/server')
jest.mock('log-timestamp')

describe('App index', () => {
  let mockServer
  let processExitSpy

  beforeEach(() => {
    jest.clearAllMocks()
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { })
    mockServer = { start: jest.fn() }
    createServer.mockResolvedValue(mockServer)
    console.log = jest.fn()
  })

  afterEach(() => {
    processExitSpy.mockRestore()
  })

  test('starts server', async () => {
    require('../../app/index')
    await Promise.resolve()
    expect(createServer).toHaveBeenCalled()
    expect(mockServer.start).toHaveBeenCalled()
  })
})
