const obtainSessionId = async (api) => {
  const initialResponse = await api.get('/api/todos')
  const splitSetCookie = initialResponse.header['set-cookie'][0].split(';')
  const sessionId = splitSetCookie.find((value) => value.includes('sessionId'))
  const sessionIdNumber = sessionId.replace('sessionId=', '')
  return sessionIdNumber
}

const postTodo = async (api, todo, sessionId) => {
  await api
    .post('/api/todos')
    .send(todo)
    .set('Cookie', `sessionId=${sessionId}`)
}

const obtainTest1Id = async (api, sessionId) => {
  const getAllResponse = await api
    .get('/api/todos')
    .set('Cookie', `sessionId=${sessionId}`)
  const test1TodoId = getAllResponse.body.find(
    (todo) => todo.task === 'test 1'
  ).id
  return test1TodoId
}

module.exports = {
  obtainSessionId,
  postTodo,
  obtainTest1Id,
}
