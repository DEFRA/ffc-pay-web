const isTextWhitespace = (str) => {
  return /^\s*$/.test(str)
}

module.exports = { isTextWhitespace }
