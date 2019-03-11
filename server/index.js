const express = require('express')
const consola = require('consola')

const bodyParser = require('body-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const api = require('./api')
const redisOptions = require('./config/index').redisOptions

const {
  Nuxt,
  Builder
} = require('nuxt')
const app = express()


// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')


// Init Nuxt.js
const nuxt = new Nuxt(config)

const {
  host = process.env.HOST || '0.0.0.0',
    port = process.env.PORT || 3000
} = nuxt.options.server


app.set('port', port)
// Body parser，用来封装 req.body
app.use(bodyParser.json({
  limit: '50mb'
}))

app.use(function (req, res, next) {
  if ('OPTIONS' === req.method) {
    res.sendStatus(200)
  } else {
    next()
  }
})

let STORE = new RedisStore(redisOptions)

// Sessions 来创建 req.session
app.use(session({
  name: 'xclub',
  store: STORE,
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  genid: function(req) {
    let id = 'xclub'
    return id // use UUIDs for session IDs
  },
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    secure: false
  }
}))

// Import API Routes
app.use('/selfapi', api)

async function start() {


  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
