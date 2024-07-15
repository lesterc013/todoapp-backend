const express = require('express')
require('dotenv').config()
const app = express()
const PORT = 3001
const baseUrl = '/api/todos'
const mongoose = require('mongoose')

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.log(error)
  }
}

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
  } else if (error.message === 'invalid id' && error.statusCode === 400) {
    return response.status(400).json({
      error: error.message,
    })
  } else if (error.message === 'valid id but document not found') {
    return response.status(404).json({
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
})

const Todo = mongoose.model('Todo', todoSchema)

// Mock database to pull todos from
let todos = [
  {
    id: 1,
    task: 'task 1',
    done: true,
  },
  {
    id: 2,
    task: 'task 2',
    done: false,
  },
  {
    id: 3,
    task: 'task 3',
    done: true,
  },
]

/**
 * MIDDLEWARE BEFORE PATHS
 */
app.use(express.json())
app.use(requestLogger)

/**
 * API CALLS
 */

// GET all todos
app.get(baseUrl, async (request, response) => {
  const allTodos = await Todo.find({})
  response.status(200).json(allTodos)
})

// POST a todo
app.post(baseUrl, async (request, response, next) => {
  const todoDocument = new Todo({
    task: request.body.task,
  })
  try {
    const savedTodo = await todoDocument.save()
    response.status(201).json(savedTodo)
  } catch (error) {
    next(error)
  }
})

// PUT a todo
app.put(`${baseUrl}/:id`, async (request, response, next) => {
  const id = request.params.id
  const update = request.body
  // findById -- catches error IF ID IS INVALID TYPE
  let doc = null
  try {
    doc = await Todo.findById(id)
    if (!doc) {
      const error = new Error('valid id but document not found')
      error.statusCode = 400
      return next(error)
    }
  } catch (error) {
    error.message = 'invalid id'
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

// DELETE request
app.delete(`${baseUrl}/:id`, async (request, response, next) => {
  const id = request.params.id
  try {
    const deleted = await Todo.findByIdAndDelete(id)
    if (!deleted) {
      const error = new Error('valid id but document not found')
      error.statusCode = 400
      return next(error)
    }
    response.status(204).end()
  } catch (error) {
    error.message = 'invalid id'
    error.statusCode = 400
    next(error)
  }
})

// GET single todo based on id
app.get(`${baseUrl}/:id`, async (request, response, next) => {
  try {
    const doc = await Todo.findById(request.params.id)
    if (!doc) {
      const error = new Error('valid id but document not found')
      error.statusCode = 400
      return next(error)
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
app.listen(PORT, () => {
  console.log('Server running on', PORT)
})
