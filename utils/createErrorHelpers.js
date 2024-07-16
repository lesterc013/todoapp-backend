// Helper function creating errors
const createDocNotFoundError = () => {
  const error = new Error('valid document id but document not found')
  error.statusCode = 400
  return error
}

const createUnauthorisedError = () => {
  const error = new Error('Unauthorised access')
  error.statusCode = 401
  return error
}

module.exports = {
  createDocNotFoundError,
  createUnauthorisedError,
}
