const { getSubscriptionDetails } = require('../service-bus')

module.exports = {
  method: 'GET',
  path: '/service-bus-details',
  options: {
    handler: async (request, h) => {
      const topicName = request.query.topic
      const subscriptionName = request.query.subscription
      const subscriptionDetails = await getSubscriptionDetails(topicName, subscriptionName, true)
      console.log(subscriptionDetails)
      return h.view('service-bus-details', { subscriptionDetails })
    }
  }
}
