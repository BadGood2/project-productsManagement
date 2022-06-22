const aws = require('aws-sdk')
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel')
const validator = require('../validator/validator')




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
        let s3 = new aws.S3({ apiVersion: '2006-03-01' });

        let uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "project-5/" + file.originalname,
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            //console.log(data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })

    })
}

const postRegister = async function (req, res) {
    try {
        let data = req.body
        let keys = ['fname', 'lname', 'phone', 'password', 'address', 'email']
        if (!keys.every(key => Object.keys(data).includes(key))) return res.status(400).send({ status: false, msg: "Keys missing for User Creation" })

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        data.address = JSON.parse(data.address)
        let { fname, lname, email, password, phone, address } = data

        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            return res.status(400).send({ status: false, msg: "No file for Image found" })
        }





        if (!isValid(fname)) return res.status(400).send({ status: false, msg: 'Enter fname.' })

        if (!isValid(lname)) return res.status(400).send({ status: false, msg: 'Enter lname.' })

        if (!isValid(email)) return res.status(400).send({ status: false, msg: 'Enter email.' })
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }
        let existingEmail = await userModel.findOne({ email: email })
        if (existingEmail) return res.status(400).send({ status: false, msg: `Email already exists.` })

        if (!isValid(phone)) return res.status(400).send({ status: false, msg: 'Enter phone.' })
        //if(!(^[6-9]\d{9}$.test(phone))) return res.status(400).send({ status: false, msg: "Please enter a valid Indian Mobile Number."})
        if (phone.length !== 10) {
            return res.status(400).send({ status: false, msg: "Please enter a valid Mobile Number" })
        }
        let existingPhone = await userModel.findOne({ phone: phone })
        if (existingPhone) return res.status(400).send({ status: false, msg: `Phone No already exists.` })

        if (!isValid(password)) return res.status(400).send({ status: false, msg: 'Enter password.' })
        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
        }
        data.password = await bcrypt.hash(password, 10)

        if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, msg: 'Enter shipping street.' })
        if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, msg: 'Enter shipping city.' })
        if (!isValid(address.shipping.pincode)) return res.status(400).send({ status: false, msg: 'Enter shipping pincode.' })

        if (!isValid(address.billing.street)) return res.status(400).send({ status: false, msg: 'Enter billing street.' })
        if (!isValid(address.billing.city)) return res.status(400).send({ status: false, msg: 'Enter billing city.' })
        if (!isValid(address.billing.pincode)) return res.status(400).send({ status: false, msg: 'Enter billing pincode.' })

        if (!(/^\d{6}$/.test(address.billing.pincode) && /^\d{6}$/.test(address.shipping.pincode))) return res.status(400).send({ status: false, msg: "Pincode Wrong" })

        data.profileImage = uploadedFileURL

        let newUser = await userModel.create(data)
        res.status(201).send({ status: true, msg: 'USER SUCCESSFULLY CREATED.', data: newUser })

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


//you need to use Authorization header and send the JWT token as Bearer token.



const secret = "Shopping-Cart"
const exp = '85000s'


const generateToken = (userData) => {
    return jwt.sign({
        userId: userData._id.toString(),
    }, secret, { expiresIn: exp })
}

const decodeToken = (token) => {
    return jwt.verify(token, secret, (err, data) => {
        if (err)
            return null
        else
            return data
    })
}

const userLogin = async (req, res) => {
    try {
        let data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details.' })

        if (Object.keys(data).length === 2 && data.email && data.password) {
            let hashedPass = await userModel.findOne({ email: data.email }).select({ _id: 0, password: 1 })
            if (!await bcrypt.compare(data.password, hashedPass.password)) return res.status(400).send({ status: false, msg: "Invalid credentials" })

            data.password = hashedPass.password
            let userCheck = await userModel.findOne(data)

            let token = generateToken(userCheck)
            let decoded_token = decodeToken(token)

            res.status(200).send({
                status: true,
                message: "User Successfully logged In",
                data: {
                    userId: userCheck._id.toString(),
                    token,
                    iat: new Date(decoded_token.iat * 1000),
                    exp: new Date(decoded_token.exp * 1000)
                }
            })
        }
        else
            res.status(401).send({
                status: false,
                messgae: "Please enter Valid E-mail and Password, Field and Key."
            })
    } catch (err) {
        console.log(err.message)
        res.status(500).send({
            status: false,
            message: err.message
        })
    }
}

//GET METHOD
// Allow an user to fetch details of their profile.
// - Make sure that userId in url param and in token is same

const getProfileData = async function (req, res) {
    try {

        let userId = req.params.userId
        let profileData = await userModel.findById({ _id: userId })
        if (!profileData) return res.status(400).send({ status: false, msg: "No record found with that UserID" })

        res.status(200).send({ status: true, msg: "User profile Data", data: profileData })



    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

//Allow an user to update their profile.
// - A user can update all the fields
// - Make sure that userId in url param and in token is same

const updateProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        if (Object.keys(data).includes("fname")) {
            if (!validator.isValid(data.fname)) return res.status(400).send({ status: false, msg: "fname field not valid" })
        }

        if (Object.keys(data).includes("lname")) {
            if (!validator.isValid(data.lname)) return res.status(400).send({ status: false, msg: "lname field not valid" })
        }

        if (Object.keys(data).includes("email")) {
            if (!isValid(data.email)) return res.status(400).send({ status: false, msg: 'Enter email.' })
            if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email))) {
                return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
            }
            let existingEmail = await userModel.findOne({ email: data.email })
            if (existingEmail) return res.status(400).send({ status: false, msg: `Email exists, provide another one` })

        }

        if (Object.keys(data).includes("phone")) {
            if (!isValid(data.phone)) return res.status(400).send({ status: false, msg: 'Enter phone.' })
            if (!(/^[6-9]\d{9}$/.test(data.phone))) return res.status(400).send({ status: false, msg: "Please enter a valid Indian Mobile Number." })

            let existingPhone = await userModel.findOne({ phone: data.phone })
            if (existingPhone) return res.status(400).send({ status: false, msg: `Phone No already exists.` })

        }

        if (Object.keys(data).includes("password")) {
            if (!isValid(data.password)) return res.status(400).send({ status: false, msg: 'Enter password.' })
            if (!(data.password.length >= 8 && data.password.length <= 15)) {
                return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
            }

            let newHashPass = await bcrypt.hash(data.password, 10)
            data.password = newHashPass
        }
        if (Object.keys(data).includes("profileImage")) {
            let files = req.files
            let uploadedFileURL
            if (files && files.length > 0) {
                uploadedFileURL = await uploadFile(files[0])
            }else return res.status(400).send({status : false, msg : "add a file for image"})
            data.profileImage = uploadedFileURL
        }

        let newProfile = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })
        if (!newProfile) return res.status(404).send({ status: false, msg: "User not found" })

        res.status(200).send({ status: true, msg: "User Profile updated", data: newProfile })


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { userLogin, postRegister, getProfileData, updateProfile }
