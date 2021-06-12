const express = require('express')
const handlebars = require('express-handlebars')
const path = require('path')
const db = require('./db')
require('dotenv').config()

// Launch Express Server
const app = express()

// PORT
const PORT = process.env.PORT || 5000

// Activate Handlebars engine
app.set('view engine', 'hbs')

// Handlebars configurations
app.engine('hbs', handlebars({
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    extname: 'hbs',
    defaultLayout: 'index',
    partialsDir: path.join(__dirname, 'views', 'partials'),
}))

// Body Parser Middleware for JSON
app.use(express.json())

//to handle url encoded data
app.use(express.urlencoded({extended: false}))

// Error Handling a request that is poorly formatted
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).send({ status: 404, message: err.message }) // Bad request
  }
  next()
})

// Basic Route
app.get('/', (req, res) => {
  res.render('main', {
      title: 'Main Page'
  })
})

// Route to Recordings
app.get('/recordings', (req, res) => {
  var database = db.get().db('AudioJungle')
  database.collection('recordings').find().sort({ "date": -1 }).toArray(function(err, docs) {
    res.render('recordings', {
      title: 'Recordings',
      recordings: docs
    })
  })
})

// Route for Posting Recordings
app.use('/recordingsDirectory', require('./recordings/recordings'))

// Static Site
app.use(express.static('public'))

// Scripts for vmsg
app.use('/scripts', express.static(path.join(__dirname, 'node_modules', 'vmsg')))

// Server Listening & connecting to MongoDB
db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    app.listen(PORT, () => console.log(`Listening on Port: ${PORT}`))
  }
})

process.on('SIGINT', function() {
  db.close(function () {
    console.log('Disconnected on app termination')
    process.exit(0)
  })
})

// 404 Page not found
app.use((req, res, next) => {
  res.status(404).send({
      status: 404,
      error: 'Not found'
    })
})