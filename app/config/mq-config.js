const joi = require('joi')

const mqSchema = joi.object({
  messageQueue: {
    host: joi.string(),
    username: joi.string(),
    password: joi.string(),
    useCredentialChain: joi.bool().default(false)
  },
  enrichmentTopic: {
    name: joi.string(),
    address: joi.string()
  },
  processingTopic: {
    name: joi.string(),
    address: joi.string()
  },
  submissionTopic: {
    name: joi.string(),
    address: joi.string()
  },
  acknowledgeTopic: {
    name: joi.string(),
    address: joi.string()
  },
  returnTopic: {
    name: joi.string(),
    address: joi.string()
  },
  enrichmentSubscription: {
    name: joi.string(),
    address: joi.string()
  },
  processingSubscription: {
    name: joi.string(),
    address: joi.string()
  },
  submissionSubscription: {
    name: joi.string(),
    address: joi.string()
  },
  acknowledgeSubscription: {
    name: joi.string(),
    address: joi.string()
  },
  returnSubscription: {
    name: joi.string(),
    address: joi.string()
  }
})
const mqConfig = {
  messageQueue: {
    host: process.env.MESSAGE_QUEUE_HOST,
    username: process.env.MESSAGE_QUEUE_USER,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === 'production'
  },
  enrichmentTopic: {
    name: process.env.ENRICHMENT_TOPIC_NAME,
    address: process.env.ENRICHMENT_TOPIC_ADDRESS
  },
  processingTopic: {
    name: process.env.PROCESSING_TOPIC_NAME,
    address: process.env.PROCESSING_TOPIC_ADDRESS
  },
  submissionTopic: {
    name: process.env.SUBMISSION_TOPIC_NAME,
    address: process.env.SUBMISSION_TOPIC_ADDRESS
  },
  acknowledgeTopic: {
    name: process.env.ACKNOWLEDGE_TOPIC_NAME,
    address: process.env.ACKNOWLEDGE_TOPIC_ADDRESS
  },
  returnTopic: {
    name: process.env.RETURN_TOPIC_NAME,
    address: process.env.RETURN_TOPIC_ADDRESS
  },
  enrichmentSubscription: {
    name: process.env.ENRICHMENT_SUBSCRIPTION_NAME,
    address: process.env.ENRICHMENT_SUBSCRIPTION_ADDRESS
  },
  processingSubscription: {
    name: process.env.PROCESSING_SUBSCRIPTION_NAME,
    address: process.env.PROCESSING_SUBSCRIPTION_ADDRESS
  },
  submissionSubscription: {
    name: process.env.SUBMISSION_SUBSCRIPTION_NAME,
    address: process.env.SUBMISSION_SUBSCRIPTION_ADDRESS
  },
  acknowledgeSubscription: {
    name: process.env.ACKNOWLEDGE_SUBSCRIPTION_NAME,
    address: process.env.ACKNOWLEDGE_SUBSCRIPTION_ADDRESS
  },
  returnSubscription: {
    name: process.env.RETURNN_SUBSCRIPTION_NAME,
    address: process.env.RETURN_SUBSCRIPTION_ADDRESS
  }
}

const mqResult = mqSchema.validate(mqConfig, {
  abortEarly: false
})

// Throw if config is invalid
if (mqResult.error) {
  throw new Error(`The message queue config is invalid. ${mqResult.error.message}`)
}

const serviceBus = mqResult.value.messageQueue
const enrichmentTopic = { ...mqResult.value.messageQueue, ...mqResult.value.enrichmentTopic }
const enrichmentSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.enrichmentSubscription }
const processingTopic = { ...mqResult.value.messageQueue, ...mqResult.value.processingTopic }
const processingSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.processingSubscription }
const submissionTopic = { ...mqResult.value.messageQueue, ...mqResult.value.submissionTopic }
const submissionSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.submissionSubscription }
const acknowledgeTopic = { ...mqResult.value.messageQueue, ...mqResult.value.acknowledgeTopic }
const acknowledgeSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.acknowledgeSubscription }
const returnTopic = { ...mqResult.value.messageQueue, ...mqResult.value.returnTopic }
const returnSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.returnSubscription }

module.exports = {
  serviceBus,
  enrichmentTopic,
  enrichmentSubscription,
  processingTopic,
  processingSubscription,
  submissionTopic,
  submissionSubscription,
  acknowledgeTopic,
  acknowledgeSubscription,
  returnTopic,
  returnSubscription
}
