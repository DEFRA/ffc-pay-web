const {
  SUCCESS,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  BAD_GATEWAY,
  CONFLICT
} = require('./http-status-codes')

module.exports = {
  [BAD_REQUEST]: 'Both your username and the file name must be provided before the upload can continue. Please check your input and try again.',
  [CONFLICT]: 'This file has already been uploaded. The file has not been re-processed. Please ensure you are uploading the correct and most recent file.',
  [INTERNAL_SERVER_ERROR]: 'An unexpected problem occurred while processing your file. Please try again later or contact support if the issue persists.',
  [BAD_GATEWAY]: 'The server received an invalid response from an upstream service. Please try again later or contact support if the issue persists.',
  [SUCCESS]: 'File uploaded successfully.'
}
