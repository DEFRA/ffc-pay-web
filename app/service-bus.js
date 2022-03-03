const { ServiceBusAdministrationClient } = require('@azure/service-bus')
const config = require('./config')
const connectionString = `Endpoint=sb://${config.serviceBus.host}/;SharedAccessKeyName=${config.serviceBus.username};SharedAccessKey=${config.serviceBus.password}`

const getPaymentSubscriptionDetails = async () => {
  const enrichment = await getSubscriptionDetails(config.enrichmentTopic.address, config.enrichmentSubscription.address)
  const paymentProcessing = await getSubscriptionDetails(config.processingTopic.address, config.processingSubscription.address)
  const paymentSubmission = await getSubscriptionDetails(config.submissionTopic.address, config.submissionSubscription.address)
  const acknowledge = await getSubscriptionDetails(config.acknowledgeTopic.address, config.acknowledgeSubscription.address)
  const returnProcessing = await getSubscriptionDetails(config.returnTopic.address, config.returnSubscription.address)

  return { enrichment, paymentProcessing, paymentSubmission, acknowledge, returnProcessing }
}

const getSubscriptionDetails = async (topicName, subscriptionName, full = false) => {
  const serviceBusAdministrationClient = new ServiceBusAdministrationClient(connectionString)
  const subscriptionProperties = await serviceBusAdministrationClient.getSubscriptionRuntimeProperties(topicName, subscriptionName)

  if (full) {
    return { subscriptionProperties }
  }

  return { topicName, subscriptionName, activeMessageCount: subscriptionProperties.activeMessageCount, deadLetterMessageCount: subscriptionProperties.deadLetterMessageCount }
}

module.exports = {
  getPaymentSubscriptionDetails,
  getSubscriptionDetails
}
