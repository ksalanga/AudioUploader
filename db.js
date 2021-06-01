const fs = require('fs')
const user = JSON.parse(fs.readFileSync('./secrets.json')).user
const pass = JSON.parse(fs.readFileSync('./secrets.json')).pass
const MongoClient = require('mongodb').MongoClient
const uri = "mongodb+srv://"+user+":"+pass+"@cluster0.tb1nm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

var state = {
  db: null,
}

exports.connect = function(done) {
  if (state.db) return done()

  client.connect(function(err, db) {
    if (err) return done(err)
    state.db = db
    done()
  })
}

exports.get = function() {
  return state.db
}

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}