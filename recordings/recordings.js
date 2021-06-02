const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs-extra')
const db = require('../db')
const { ObjectId } = require('bson')
const moment = require('moment')

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            let path = './uploads'
            fs.mkdirsSync(path)
            callback(null, path)
        },
        filename: (req, file, callback) => {
            createRecording(req).then((id) => {
                var file_name = id + '.mp3'
                callback(null, file_name)
            })
        }
    })
})

var type = upload.single('audio-file') // bool to check for memory limit here: ternary operator

router.post('/', type, (req, res) => {
    res.status(200)
    res.send('OK')
})

router.delete('/delete', (req, res) => {
    deleteRecording(req.body._id).then((dbResponse) => {
        if (dbResponse == null || dbResponse == undefined) {
            res.status(400).json({ msg: 'ID already deleted' })
        } else {
            res.status(200)
        }
    })
})

router.get('/get', (req, res) => {
    var database = db.get().db('AudioJungle')
    var recordings = database.collection('recordings')
    recordings.findOne({"_id": ObjectId(req.query.id)}, function(err, result) {
        if (err) throw err

        if (result == null || result == undefined) {
            return res.status(400).json({
                status: 404,
                error: 'Recording no longer in the database'
            })
        }
        res.status(200)
        let current_datetime = result.date
        let formatted_date = (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + "-" + current_datetime.getFullYear() + " at " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
        res.json({
            name: result.name,
            date: formatted_date
        })
    })
})

async function createRecording(req) {
    var database = db.get().db('AudioJungle')
    var recordings = database.collection('recordings')
    var audioObject = {
        name: req.body.name,
        date: moment().format('MMMM Do YYYY, h:mm:ss a')
    }

    var dbResponse = await recordings.insertOne(audioObject)
    return dbResponse.insertedId
}

async function deleteRecording(id) {
    var database = db.get().db('AudioJungle')
    var recordings = database.collection('recordings')
    var audioToDelete = {
        _id: ObjectId(id)
    }

    var deleteResult = await recordings.deleteOne(audioToDelete)
    return deleteResult
}

module.exports = router