const fs = require('fs')

const readFileContent = (path) => {
  return fs.readFileSync(path, 'utf8')
}

module.exports = {
  readFileContent
}
