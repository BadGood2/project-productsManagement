const aws = require('aws-sdk')
const bcrypt = require('bcrypt');
const { json } = require('body-parser');
const userModel = require('../models/userModel')


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false //it checks whether the value is null or undefined.
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}


/*******************************AWS******************************************************/
aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  //HERE
            Key: "group41/" + file.originalname, //HERE 
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

const postRegister = async function (req, res) {
    try {
        let data = JSON.parse(req.body.body)
        
        if(!isValidRequestBody(data))return res.status(400).send({status:false, msg:'Enter details for user creation.'})
        
        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

        let { fname, lname, email,password, phone, address } = data

        if(!isValid(fname))return res.status(400).send({status:false, msg:'Enter fname.'})
        
        if(!isValid(lname))return res.status(400).send({status:false, msg:'Enter lname.'})
        
        if(!isValid(email))return res.status(400).send({status:false, msg:'Enter email.'})
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }
        let existingEmail= await userModel.findOne({email:email})
        if(existingEmail)return res.status(400).send({status:false, msg:`${email} already exists.`})

        if(!isValid(phone))return res.status(400).send({status:false, msg:'Enter phone.'})
        //if(!(^[6-9]\d{9}$.test(phone))) return res.status(400).send({ status: false, msg: "Please enter a valid Indian Mobile Number."})
        if (`${phone}`.length < 10 || `${phone}`.length > 10) {
            return res.status(400).send({ status: false, msg: "Please enter a valid Mobile Number" })
        }
        let existingPhone= await userModel.findOne({phone:phone})
        if(existingPhone)return res.status(400).send({status:false, msg:`${phone} already exists.`})

        if(!isValid(password))return res.status(400).send({status:false, msg:'Enter password.'})
        if (!(`${password}`.length < 15 || `${password}`.length > 8)) {
            return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
        }
        data.password = await bcrypt.hash(password,10)

        if(!isValid(address.shipping.street))return res.status(400).send({status:false, msg:'Enter shipping street.'})
        if(!isValid(address.shipping.city))return res.status(400).send({status:false, msg:'Enter shipping city.'})
        if(!isValid(address.shipping.pincode))return res.status(400).send({status:false, msg:'Enter shipping pincode.'})
        
        if(!isValid(address.billing.street))return res.status(400).send({status:false, msg:'Enter billing street.'})
        if(!isValid(address.billing.city))return res.status(400).send({status:false, msg:'Enter billing city.'})
        if(!isValid(address.billing.pincode))return res.status(400).send({status:false, msg:'Enter billing pincode.'})

        data.profileImage = uploadedFileURL

        let newUser = await userModel.create(data)
        res.status(201).send({status:true,msg:'USER SUCCESSFULLY CREATED.',data:newUser})

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { postRegister }