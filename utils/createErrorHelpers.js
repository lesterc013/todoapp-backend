// Helper function creating errors
const createDocNotFoundError = () => {
  const error = new Error('valid document id but document not found')
  return error
}

const createUnauthorisedError = () => {
  const error = new Error('Unauthorised access')
  return error
}

module.exports = {
  createDocNotFoundError,
  createUnauthorisedError,
}
