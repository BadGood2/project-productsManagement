const express = require('express')
const multer = require("multer")
const { AppConfig } = require('aws-sdk')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')

const app = express()
app.use(bodyparser.json())
app.use(multer().any())

const router = require('./routes/route')

mongoose.connect("mongodb+srv://nas:nas1234@cluster0.fci9p.mongodb.net/group30Database",
    { useNewUrlParser: true })
    .then(() => console.log("mongoDB is Connected!!"))
    .catch(err => console.log(err))

app.use('/', router)

app.listen(process.env.PORT || 3000, () => {
    console.log("server connected at Port :", process.env.PORT || 3000)
})