const express = require('express')
const app = express()
const PORT = 3001

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
app.get('/api/todos', (request, response) => {
  response.status(200).json(todos)
})

// GET single todo based on id
app.get('/api/todos/:id', (request, response) => {
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
