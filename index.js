const express = require('express')
const app = express()
const PORT = 3001
const baseUrl = '/api/todos'

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

app.use(express.json())

/**
 * API CALLS
 */

// GET all todos
app.get(baseUrl, (request, response) => {
  response.status(200).json(todos)
})

// POST a todo
app.post(baseUrl, (request, response) => {
  // Task must be filled i.e. length cannot be 0 -- put in Schema
  // Done default is false -- put in the Schema
  const todo = request.body
  if (todo.task.length === 0) {
    response.status(400).json({
      error: 'task not provided',
    })
  } else {
    todos = todos.concat(todo)
    response.status(201).json(todo)
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

// Listener
app.listen(PORT, () => {
  console.log('Server running on', PORT)
})
