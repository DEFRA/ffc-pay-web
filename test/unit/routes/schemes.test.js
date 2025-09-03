const { getProcessingData, post } = require('../../../app/api')
const routes = require('../../../app/routes/schemes')
const ViewModel = require('../../../app/routes/models/update-scheme')

jest.mock('../../../app/api')

describe('payment-schemes routes', () => {
  test('GET /payment-schemes should change the name of any scheme named "SFI" to "SFI22"', async () => {
    const handler = routes.find(route => route.path === '/payment-schemes' && route.method === 'GET').options.handler
    getProcessingData.mockResolvedValue({
      payload: {
        paymentSchemes: [
          { name: 'SFI' },
          { name: 'Other Scheme Name' }
        ]
      }
    })
    const hapi = {
      view: jest.fn()
    }
    await handler({}, hapi)
    expect(hapi.view).toHaveBeenCalledWith('payment-schemes', {
      schemes: [
        { name: 'SFI22' },
        { name: 'Other Scheme Name' }
      ]
    })
  })

  test('POST /payment-schemes should redirect to /update-payment-scheme with the correct query parameters', async () => {
    const handler = routes.find(route => route.path === '/payment-schemes' && route.method === 'POST').options.handler
    const hapi = {
      redirect: jest.fn()
    }
    await handler({ payload: { active: true, schemeId: 1, name: 'Test' } }, hapi)
    expect(hapi.redirect).toHaveBeenCalledWith('/update-payment-scheme?schemeId=1&active=true&name=Test')
  })

  test('GET /update-payment-scheme should return a view with a new ViewModel', async () => {
    const handler = routes.find(route => route.path === '/update-payment-scheme' && route.method === 'GET').options.handler
    const hapi = {
      view: jest.fn()
    }
    const query = { schemeId: 1, name: 'Test', active: true }
    await handler({ query }, hapi)
    expect(hapi.view).toHaveBeenCalledWith('update-payment-scheme', new ViewModel(query))
  })

  test('POST /update-payment-scheme should post to /change-payment-status and redirect to /payment-schemes if confirm is true', async () => {
    const handler = routes.find(route => route.path === '/update-payment-scheme' && route.method === 'POST').options.handler
    const hapi = {
      redirect: jest.fn()
    }
    const payload = { confirm: true, schemeId: 1, name: 'Test', active: true }
    await handler({ payload }, hapi)
    expect(post).toHaveBeenCalledWith('/change-payment-status', { schemeId: 1, active: false })
    expect(hapi.redirect).toHaveBeenCalledWith('/payment-schemes')
  })
})
