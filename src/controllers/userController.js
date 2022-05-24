const userModel = require("../models/userModel")
const bcrypt = require("bcrypt")
const aws = require("aws-sdk")

aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        let s3 = new aws.S3({ apiVersion: '2006-03-01' });

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "abcd/" + file.originalname,
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })
    })
}

const registerUser = async function (req, res) {
    try {
        let data = req.body.body
        data = JSON.parse(data)
        let uploadedFileURL;
        try {
            let files = req.files
            if (files && files.length > 0) {
                uploadedFileURL = await uploadFile(files[0])
            }
        } catch (err) {
            return res.status(400).send({ status: false, msg: err.message })
        }
        data.profileImage = uploadedFileURL

        const hashPassword = await bcrypt.hash(data.password, 10)
        data.password = hashPassword

        let created = await userModel.create(data)
        res.status(201).send({status: true, data : created})


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }


}

module.exports = {registerUser}