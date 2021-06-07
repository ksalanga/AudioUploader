const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs-extra')
const db = require('../db')
const { ObjectId } = require('bson')
var maxSize = 5 * Math.pow(10,9)

const upload = multer({
    fileFilter: function (req, file, cb) {
        console.log('file filter maybe?')
        console.log(file)
        cb(null, true)
    },
    limits: { fileSize: maxSize },
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            console.log(req)
            // Multer looks at the root directory because it operates separate from express
            let path = './public/uploads'
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

var type = upload.single('audio-file')

router.post('/', type, (req, res) => {
    res.status(200)
    res.send('OK')
})

router.delete('/', (req, res) => {
    deleteRecording(req.body._id).then((dbResponse) => {
        if (dbResponse == null || dbResponse == undefined) {
            res.status(400).json({ msg: 'ID already deleted' })
        } else {
            res.status(200)
        }
    })
})

router.get('/', (req, res) => {
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

        res.json({
            name: result.name,
            date: result.date.toLocaleString('default', {
                dateStyle: 'full',
                timeStyle: 'long'
            })
        })
    })
})

async function createRecording(req) {
    var database = db.get().db('AudioJungle')
    var recordings = database.collection('recordings')
    var audioObject = {
        name: req.body.name,
        date: new Date()
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