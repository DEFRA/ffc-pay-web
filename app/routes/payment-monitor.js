const { getPaymentSubscriptionDetails } = require('../service-bus')
const { getStorageDetails } = require('../blob-storage')

module.exports = {
  method: 'GET',
  path: '/payment-monitor',
  options: {
    handler: async (request, h) => {
      const subscriptionDetails = await getPaymentSubscriptionDetails()
      console.log(subscriptionDetails)
      const storageDetails = await getStorageDetails()
      return h.view('payment-monitor', { subscriptionDetails, storageDetails })
    }
  }
}
