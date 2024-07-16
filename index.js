const app = require('./app')
const config = require('./utils/config')

// Listener
app.listen(config.PORT, () => {
  console.log('Server running on', config.PORT)
})
