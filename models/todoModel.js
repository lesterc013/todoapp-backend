const mongoose = require('mongoose')

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

todoSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

const Todo = mongoose.model('Todo', todoSchema)

module.exports = Todo
