const retry = async (fn, retries = 5, interval = 500, exponential = false) => {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= retries) {
        throw err
      }
      const delay = exponential ? interval * (2 ** attempt) : interval
      await new Promise(resolve => setTimeout(resolve, delay))
      attempt++
    }
  }
}
module.exports = { retry }
