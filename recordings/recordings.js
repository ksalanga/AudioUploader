const express = require('express')
const router = express.Router()
const dotenv = require('dotenv')
const multer = require('multer')
const db = require('../db')
const { ObjectId } = require('bson')
const { Storage } = require('@google-cloud/storage')
const rateLimit = require("express-rate-limit")

dotenv.config()

const gcloud_private_key = process.env.GCLOUD_PRIVATE_KEY

// if (process.env.NODE_ENV !== 'development') {
//     gcloud_private_key = `"${gcloud_private_key}"`
//     console.log("PRODUCTION BRO!!")
// }

const storage = new Storage({projectId: process.env.GCLOUD_PROJECT, credentials: {client_email: process.env.GCLOUD_CLIENT_EMAIL, private_key: gcloud_private_key}})

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (req.body.name == null || req.body.name == "") {
            cb(null, false)
            return cb(new Error('Please provide a name key!'))
        }
        if (file.mimetype == "audio/mpeg") {
            cb(null, true)
        } else {
            cb(null, false)
            return cb(new Error('Only .mp3 format allowed!'))
        }
    },
    limits: {
        // 1 megabyte
        fileSize: 1 * 1024 * 1024
    }
}).single('audio-file')

const bucket = storage.bucket(process.env.GCS_BUCKET) 

const uploadAudioLimiter = rateLimit({
    windowMs: 30 * 60000, // 30 minutes
    max: 5, // start blocking after this many requests
    handler: function(req, res, /*next*/) {
        return res.status(429).json({
            limit: req.rateLimit.limit,
            resetTime: req.rateLimit.resetTime.toLocaleString('default', {
                dateStyle: 'full',
                timeStyle: 'long'
            })
        })
    }
  })

router.post('/', uploadAudioLimiter, (req, res) => {
    upload(req, res, err => {
        if (err instanceof multer.MulterError) {
            console.log(multer.MulterError)
            return res.status(300).json({error: 'File Size exceeds 1 megabyte'})
        } else if (err) {
            return res.status(300).json({error: err.message})
        } else {
            createRecording(req, res)
        }
    })
})

router.get('/', (req, res) => {
    var database = db.get().db('AudioJungle')
    var recordings = database.collection('recordings')
    recordings.findOne({"_id": ObjectId(req.query.id)}, function(err, result) {
        if (err) throw err

        if (result == null || result == undefined) {
            return res.status(404).redirect('/recordings')
        }

        return res.status(200).json({
            name: result.name,
            date: result.date.toLocaleString('default', {
                dateStyle: 'full',
                timeStyle: 'long'
            }),
            href: result.href
        })
    })
})

router.delete('/:id', (req, res) => {
    const id = req.params.id
    db.deleteRecording(id).then((dbResponse) => {
        if (dbResponse == null || dbResponse == undefined) {
            res.status(404).json({ msg: 'ID already deleted' })
        } else {
            bucket.deleteFiles({
                prefix: id
            }).catch(err => {
                console.log(err)
                throw err
            })

            res.status(200).json({msg: `Audio File of ID: ${req.params.id} has been deleted from Storage and DB`})
        }
    })
})

async function createRecording(req, res) {
    const recordingsSizeLimit = 400 // 400 entries
    const currentRecordingsSize = await db.getStorageSize()

    if (currentRecordingsSize < recordingsSizeLimit) {
        db.storeRecording(req).then(id => {
            const newFileName = id + "-" + req.body.name + '.mp3'
            const blob = bucket.file(newFileName)
            const blobStream = blob.createWriteStream({resumable: false})
    
            blobStream.on("error", err => {throw new Error(err.message)})
    
            blobStream.on("finish", () => {
                const publicURL = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${blob.name}`
                var database = db.get().db('AudioJungle')
                var recordings = database.collection('recordings')
                recordings.updateOne({"_id": ObjectId(id)}, {$set: {"href": publicURL, "size": req.file.size}})
            })

            blobStream.end(req.file.buffer)
            res.status(200)
            res.json({message: 'OK'})
        })
    } else {
        return res.status(400).json({StorageError: "Audio File Storage limit of 400 recordings has been exceeded"})
    }
}

module.exports = router