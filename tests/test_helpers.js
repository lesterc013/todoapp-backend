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

module.exports = {
  obtainSessionId,
  postTodo,
}
