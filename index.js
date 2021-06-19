const express = require('express')
const handlebars = require('express-handlebars')
const path = require('path')
const db = require('./db')
require('dotenv').config()

// Launch Express Server
const app = express()

// Activate Handlebars engine
app.set('view engine', 'hbs')

// Handlebars configurations
app.engine('hbs', handlebars({
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    extname: 'hbs',
    defaultLayout: 'index'
}))

// Body Parser Middleware for JSON
app.use(express.json())

// Handle url encoded data
app.use(express.urlencoded({extended: false}))

// Error Handling a request that is poorly formatted
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).send({ status: 404, message: err.message }) // Bad request
  }
  next()
})

// Home Directory
app.get('/', (req, res) => {
  res.render('main', {
      title: 'Main Page'
  })
})

// Recordings Directory
app.get('/recordings', (req, res) => {
  var database = db.get().db('AudioJungle')
  database.collection('recordings').find().sort({ "date": -1 }).toArray(function(err, docs) {
    res.render('recordings', {
      title: 'Recordings',
      recordings: docs
    })
  })
})

// Recordings API
app.use('/recordingsDirectory', require('./recordings/recordings'))

// Static Files
app.use(express.static('public')) // Public Directory
app.use('/scripts', express.static(path.join(__dirname, 'node_modules', 'vmsg'))) // Scripts for vmsg
app.use('/credits', express.static(path.join(__dirname, 'public', 'HTML', 'credits.html'))) // Credits

// Server Listening & connecting to MongoDB
app.listen(44886, () => {
  db.connect(function(err) {
    if (err) {
      console.log('Unable to connect to Mongo.')
      process.exit(1)
    } else {
      
    }
  })
  console.log(`Listening`)
})

process.on('SIGINT', function() {
  db.close(function () {
    console.log('Disconnected on app termination')
    process.exit(0)
  })
})

// 404 Page not found
app.use((req, res) => {
  res.status(404).render('notFound', {title: 'Not Found'})
})