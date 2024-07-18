const app = require('./app')
const config = require('./utils/config')

// Listener
const PORT = config.PORT || 3001
app.listen(PORT, () => {
  console.log('Server running on', config.PORT)
})
