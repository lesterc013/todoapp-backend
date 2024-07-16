const express = require('express')
const cookieParser = require('cookie-parser')
const config = require('./utils/config')
const middleware = require('./utils/middleware')
const Todo = require('./models/todoModel')
const app = express()
const baseUrl = '/api/todos'
const mongoose = require('mongoose')
const todoRouter = require('./controllers/todoRouter')

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

/**
 * USE MIDDLEWARE BEFORE PATHS
 */
app.use(express.json())
app.use(cookieParser())
app.use(middleware.requestLogger)
app.use(middleware.setSessionId)
app.use('/api/todos', todoRouter)

app.use(middleware.errorHandler)

// Listener
app.listen(config.PORT, () => {
  console.log('Server running on', config.PORT)
})
