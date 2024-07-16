const express = require('express')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const config = require('./utils/config')
const app = express()
const baseUrl = '/api/todos'
const mongoose = require('mongoose')

const connectMongo = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.log(error)
  }
}

/**
 * CUSTOM MIDDLEWARE
 */
const requestLogger = (request, response, next) => {
  console.log('Method', request.method)
  console.log('Path', request.path)
  console.log('Body', request.body)
  console.log('---')
  next()
}

const errorHandler = (error, request, response, next) => {
  if (
    error.name === 'ValidationError' &&
    error.message.includes('Todo validation failed')
  ) {
    return response.status(400).json({
      error: error.message,
    })
  } else if (
    error.message === 'invalid document id' &&
    error.statusCode === 400
  ) {
    return response.status(400).json({
      error: error.message,
    })
  } else if (error.message === 'valid document id but document not found') {
    return response.status(404).json({
      error: error.message,
    })
  } else if (
    error.statusCode === 401 &&
    error.message === 'Unauthorised access'
  ) {
    return response.status(401).json({
      error: error.message,
    })
  }
  next()
}

mongoose.set('strictQuery', false)
connectMongo()

const todoSchema = new mongoose.Schema({
  task: {
    type: String,
    required: [true, 'Task is required'],
    minLength: [1, 'Task must be at least 1 character long'],
  },
  done: {
    type: Boolean,
    default: false,
  },
  sessionId: {
    type: String,
    required: true,
  },
  // Does not exactly expire at that time due to limitations of mongodb removal (found in docs)
  expireAt: {
    type: Date,
    required: true,
  },
})

const Todo = mongoose.model('Todo', todoSchema)

/**
 * MIDDLEWARE BEFORE PATHS
 */
app.use(express.json())
app.use(requestLogger)
app.use(cookieParser())
app.use((request, response, next) => {
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
})

/**
 * API CALLS
 */

// GET all todos
app.get(baseUrl, async (request, response) => {
  const allTodos = await Todo.find({ sessionId: request.sessionId })
  // find() returns [] if nothing is found; keep this in mind for frontend rendering
  response.status(200).json(allTodos)
})

// POST a todo
app.post(baseUrl, async (request, response, next) => {
  const timeToExpire = 1000 * 60 * 5
  const todoDocument = new Todo({
    task: request.body.task,
    sessionId: request.sessionId,
    // Hardcode expireAt to be 5mins from when the POST is made
    // new Date will set the milliseconds from the epoch to be a legit date format
    expireAt: new Date(Date.now() + timeToExpire),
  })
  try {
    const savedTodo = await todoDocument.save()
    response.status(201).json(savedTodo)
  } catch (error) {
    next(error)
  }
})

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

// PUT a todo
app.put(`${baseUrl}/:id`, async (request, response, next) => {
  const id = request.params.id
  const update = request.body
  // findById -- catches error IF ID IS INVALID TYPE
  let doc = null
  try {
    doc = await Todo.findById(id)
    console.log('doc', doc)
    console.log('this sessionId', request.sessionId)
    console.log('doc sessionId', doc.sessionId)
    if (!doc) {
      return next(createDocNotFoundError())
    }
    // sessionId check
    if (doc.sessionId !== request.sessionId) {
      return next(createUnauthorisedError())
    }
  } catch (error) {
    error.message = 'invalid document id'
    error.statusCode = 400
    return next(error)
  }
  // Update the relevant fields
  doc.task = update.task
  doc.done = update.done

  // Valid id -- save() to run full validation, error if validation of Schema does not work
  try {
    const savedDoc = await doc.save()
    response.status(201).json(savedDoc)
  } catch (error) {
    console.log(error)
    next(error)
  }
})

// DELETE one todo
app.delete(`${baseUrl}/:id`, async (request, response, next) => {
  const id = request.params.id
  // Find the doc first to do error checking
  try {
    const doc = await Todo.findById(id)
    if (!doc) {
      return next(createDocNotFoundError())
    }
    if (doc.sessionId !== request.sessionId) {
      return next(createUnauthorisedError())
    }
  } catch (error) {
    error.message = 'invalid id'
    error.statusCode = 400
    next(error)
  }

  // If all error checks pass, run this block
  try {
    await Todo.findByIdAndDelete(id)
    response.status(204).end()
  } catch (error) {
    console.log(error)
    next(error)
  }
})

// DELETE ALL TODOS
app.delete(baseUrl, async (request, response) => {
  const deleted = await Todo.deleteMany({ sessionId: request.sessionId })
  console.log(deleted)
  response.status(204).end()
})

// GET single todo based on id
app.get(`${baseUrl}/:id`, async (request, response, next) => {
  try {
    const doc = await Todo.findById(request.params.id)
    if (!doc) {
      return next(createDocNotFoundError())
    }
    if (doc.sessionId !== request.sessionId) {
      return next(createUnauthorisedError())
    }
    response.status(200).json(doc)
  } catch (error) {
    error.message = 'invalid id'
    error.statusCode = 400
    next(error)
  }
})

app.use(errorHandler)

// Listener
app.listen(config.PORT, () => {
  console.log('Server running on', config.PORT)
})
