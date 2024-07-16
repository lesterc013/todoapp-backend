const express = require('express')
const cookieParser = require('cookie-parser')
const config = require('./utils/config')
const middleware = require('./utils/middleware')
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
 * USE MIDDLEWARE BEFORE PATHS
 */
app.use(express.json())
app.use(cookieParser())
app.use(middleware.requestLogger)
app.use(middleware.setSessionId)

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

app.use(middleware.errorHandler)

// Listener
app.listen(config.PORT, () => {
  console.log('Server running on', config.PORT)
})
