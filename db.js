require('dotenv').config()
const { ObjectId } = require('bson')
const user = process.env.MONGOUSER
const pass = process.env.MONGOPASS
const MongoClient = require('mongodb').MongoClient
const uri = "mongodb+srv://"+user+":"+pass+"@cluster0.tb1nm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

var state = {
  db: null
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

exports.storeRecording = async function storeRecording(req) {
  var database = state.db.db('AudioJungle')
  var recordings = database.collection('recordings')
  var audioObject = {
      name: req.body.name,
      date: new Date()
  }

  var dbResponse = await recordings.insertOne(audioObject)
  
  return dbResponse.insertedId.toString()
}

exports.deleteRecording = async function deleteRecording(id) {
  var database = state.db.db('AudioJungle')
  var recordings = database.collection('recordings')
  var audioToDelete = {
      "_id": ObjectId(id)
  }

  var recordingObj = await recordings.findOne(audioToDelete)
  if (recordingObj == null) return null

  var deleteResult = await recordings.deleteOne(audioToDelete)
  return deleteResult
}

// returns the number of recordings in the database
exports.getStorageSize = async function getStorageSize() {
  var database = state.db.db('AudioJungle')
  var recordings = database.collection('recordings')
  
  var recordingsCount = await recordings.countDocuments({})

  if (recordingsCount == null) return 0
  
  return recordingsCount
}