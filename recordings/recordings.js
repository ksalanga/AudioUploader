const express = require('express')
const router = express.Router()
const multer = require('multer')
const db = require('../db')
const { ObjectId } = require('bson')
const { Storage } = require('@google-cloud/storage')

const storage = new Storage({projectId: process.env.GCLOUD_PROJECT, credentials: {client_email: process.env.GCLOUD_CLIENT_EMAIL, private_key: process.env.GCLOUD_PRIVATE_KEY}})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        // 2 megabytes
        fileSize: 2 * 1024 * 1024
    }
}).single('audio-file')

const bucket = storage.bucket(process.env.GCS_BUCKET) 

router.post('/', (req, res) => {
    upload(req, res, err => {
        if (err instanceof multer.MulterError) {
            res.status(300)
            res.json({error: 'MulterError'})
            return
        } else if (err) {
            res.status(300)
            res.json({error: err.message})
            return
        } else {
            createRecording(req, res)
        }
    })
})

router.delete('/', (req, res) => {
    db.deleteRecording(req.body._id).then((dbResponse) => {
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
            }),
            href: result.href
        })
    })
})

async function createRecording(req, res) {
    const recordingsSizeLimit = 4.5 * Math.pow(10, 9)
    const currentRecordingsSize = await db.getStorageSize()
    if ((currentRecordingsSize + req.file.size) < recordingsSizeLimit) {
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
        res.status(300)
        res.json({StorageError: "Audio File Storage limit has been exceeded"})
    }
}

module.exports = router