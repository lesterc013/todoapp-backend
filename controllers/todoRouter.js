const todoRouter = require('express').Router()
const Todo = require('../models/todoModel')
const {
  createDocNotFoundError,
  createUnauthorisedError,
} = require('../utils/createErrorHelpers')

/**
 * API CALLS
 */

// GET all todos
todoRouter.get('/', async (request, response) => {
  const allTodos = await Todo.find({ sessionId: request.sessionId })
  // find() returns [] if nothing is found; keep this in mind for frontend rendering
  response.status(200).json(allTodos)
})

// POST a todo
todoRouter.post('/', async (request, response, next) => {
  const timeToExpire = 1000 * 60
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

// PUT a todo
todoRouter.put('/:id', async (request, response, next) => {
  const id = request.params.id
  const update = request.body
  // findById -- catches error IF ID IS INVALID TYPE
  let doc = null
  try {
    doc = await Todo.findById(id)
    if (!doc) {
      return next(createDocNotFoundError())
    }
    // sessionId check
    if (doc.sessionId !== request.sessionId) {
      return next(createUnauthorisedError())
    }
  } catch (error) {
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
todoRouter.delete('/:id', async (request, response, next) => {
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
todoRouter.delete('/', async (request, response) => {
  const deleted = await Todo.deleteMany({ sessionId: request.sessionId })
  console.log(deleted)
  response.status(204).end()
})

// GET single todo based on id
todoRouter.get('/:id', async (request, response, next) => {
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
    next(error)
  }
})

module.exports = todoRouter
