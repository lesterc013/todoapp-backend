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
app.get(baseUrl, (request, response) => {
  response.status(200).json(todos)
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
app.put(`${baseUrl}/:id`, (request, response) => {
  const id = parseInt(request.params.id)
  const update = request.body
  // Invalid id in url
  if (!todos.find((todo) => todo.id === id)) {
    response.status(400).json({
      error: 'invalid id',
    })
  }
  // Task is empty
  else if (update.task.length === 0) {
    response.status(400).json({
      error: 'task not provided',
    })
  } else {
    todos = todos.map((todo) => (todo.id === id ? update : todo))
    response.status(200).json(update)
  }
})

// DELETE request
app.delete(`${baseUrl}/:id`, (request, response) => {
  const id = parseInt(request.params.id)
  // Invalid id
  if (!todos.find((todo) => todo.id === id)) {
    response.status(400).json({
      error: 'invalid id',
    })
  } else {
    todos = todos.filter((todo) => todo.id !== id)
    response.status(204).end()
  }
})

// GET single todo based on id
app.get(`${baseUrl}/:id`, (request, response) => {
  // Use the id and filter out the matchin todo
  const id = parseInt(request.params.id)
  const todo = todos.filter((todo) => todo.id === id)
  if (todo.length === 0) {
    response.status(400).json({
      error: 'BadRequest: invalid id',
    })
  }
  response.status(200).json(todo)
})

app.use(errorHandler)

// Listener
app.listen(PORT, () => {
  console.log('Server running on', PORT)
})
