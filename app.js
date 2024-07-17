const express = require('express')
const app = express()

const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')

const config = require('./utils/config')
const middleware = require('./utils/middleware')
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
// Note: Because config module already required dotenv, dont need to require it again here
if (process.env.NODE_ENV !== 'test') {
  app.use(middleware.requestLogger)
}
app.use(middleware.setSessionId)
app.use('/api/todos', todoRouter)

app.use(middleware.errorHandler)

module.exports = app
