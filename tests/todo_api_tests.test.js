const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../app')
const Todo = require('../models/todoModel')
const helper = require('./test_helpers')

const api = supertest(app)

beforeEach(async () => {
  // Start each test with a clean slate
  await Todo.deleteMany({})
})

test('Session ID is generated for user without one when GET request made to baseUrl -- set-cookie should be in the response', async () => {
  const response = await api.get('/api/todos').expect(200)
  assert(response.header['set-cookie'] !== null)
})

describe('POST requests suite', () => {
  test('POST one todo successful', async () => {
    const sessionId = await helper.obtainSessionId(api)
    const todo = {
      task: 'POST one todo test',
    }

    const postResponse = await api
      .post('/api/todos')
      .send(todo)
      .set('Cookie', `sessionId=${sessionId}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(postResponse.body.task, 'POST one todo test')
  })
})

describe('GET requests suite', () => {
  let sessionId
  // POST a few todos before each test in this suite
  beforeEach(async () => {
    sessionId = await helper.obtainSessionId(api)
    // POST a three todos with this sessionId
    for (i = 1; i <= 3; i++) {
      const todo = {
        task: `test ${i}`,
      }
      await helper.postTodo(api, todo, sessionId)
    }
  })

  test('GET all todos successful with a valid sessionId', async () => {
    const finalResponse = await api
      .get('/api/todos')
      .set('Cookie', `sessionId=${sessionId}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    // Check the status, content, body.length === how many POSTS
    assert(finalResponse.body.length === 3)
  })

  test('GET all todos with a different sessionId should return empty array instead of what was POST with first sessionId', async () => {
    const firstResponse = await api
      .get('/api/todos')
      .set('Cookie', `sessionId=${sessionId}`)

    const anotherSessionId = await helper.obtainSessionId(api)
    const anotherResponse = await api
      .get('/api/todos')
      .set('Cookie', `sessionId=${anotherSessionId}`)
      .expect(200)

    assert.notDeepStrictEqual(anotherResponse.body, firstResponse.body)
    assert(anotherResponse.body.length === 0)
  })

  describe('GET one todo suite', () => {
    let test1TodoId
    beforeEach(async () => {
      test1TodoId = await helper.obtainTest1Id(api, sessionId)
    })
    test('Successful with a valid sessionId', async () => {
      const test1Response = await api
        .get(`/api/todos/${test1TodoId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(test1Response.body.task, 'test 1')
      assert.strictEqual(test1Response.body.id, test1TodoId)
    })

    test('Forbidden: another sessonId', async () => {
      const anotherSessionId = await helper.obtainSessionId(api)
      const forbiddenResponse = await api
        .get(`/api/todos/${test1TodoId}`)
        .set('Cookie', `sessionId=${anotherSessionId}`)
        .expect(401)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(forbiddenResponse.body.error, 'Unauthorised access')
    })

    test('Valid doc Id but not found', async () => {
      await Todo.findByIdAndDelete(test1TodoId)
      const notFoundResponse = await api
        .get(`/api/todos/${test1TodoId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .expect(404)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(
        notFoundResponse.body.error,
        'valid document id but document not found'
      )
    })

    test('Cast error doc Id', async () => {
      const castErrorResponse = await api
        .get('/api/todos/invalid')
        .set('Cookie', `sessionId=${sessionId}`)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(
        castErrorResponse.body.error,
        'id provided cannot be cast to valid mongo id'
      )
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
