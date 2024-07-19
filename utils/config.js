require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI
const encKey = process.env.ENC_KEY
const sigKey = process.env.SIG_KEY

module.exports = {
  PORT,
  MONGODB_URI,
  encKey,
  sigKey,
}
