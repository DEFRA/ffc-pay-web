const statementAggregator = require('./statement-aggregator')
const paymentAggregator = require('./payment-aggregator')

module.exports = {
  statements: statementAggregator,
  payments: paymentAggregator
}
