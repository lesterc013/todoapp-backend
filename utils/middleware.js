const crypto = require('crypto')

const requestLogger = (request, response, next) => {
  console.log('Method', request.method)
  console.log('Path', request.path)
  console.log('Body', request.body)
  console.log('---')
  next()
}

const errorHandler = (error, request, response, next) => {
  // console.log('error name:', error.name)
  if (
    error.name === 'ValidationError' &&
    error.message.includes('Todo validation failed')
  ) {
    return response.status(400).json({
      error: error.message,
    })
  } else if (error.name === 'CastError') {
    return response.status(400).json({
      error: 'id provided cannot be cast to valid mongo id',
    })
  } else if (
    error.name === 'Error' &&
    error.message === 'valid document id but document not found'
  ) {
    return response.status(404).json({
      error: error.message,
    })
  } else if (
    error.name === 'Error' &&
    error.message === 'Unauthorised access'
  ) {
    return response.status(401).json({
      error: error.message,
    })
  }
  next()
}

const setSessionId = (request, response, next) => {
  if (!request.cookies.sessionId) {
    // Generate the UUID
    const sessionId = crypto.randomUUID()
    const maxAge = 1000 * 60 * 5
    // Store it in response.cookie which is the Set-Cookie header for subsequent requests
    response.cookie('sessionId', sessionId, {
      httpOnly: true,
      maxAge: maxAge, // 1000 * 60 * 60 * 24 * 7
    })
    // Set the current request.sessionId = this sessionId so that the following routes can use it for this request
    request.sessionId = sessionId
  } else {
    // We access the request.cookies.sessionId, and set it to something we can use further below
    request.sessionId = request.cookies.sessionId
  }
  next()
}

module.exports = {
  requestLogger,
  errorHandler,
  setSessionId,
}
