const getPoundValue = (value) => {
  return value ? (Number(value) / 100).toFixed(2) : '0.00'
}

module.exports = {
  getPoundValue
}
