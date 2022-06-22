const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const validation = require("../validator/validator")
const aws = require('aws-sdk')
const mongoose = require("mongoose")


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false //it checks whether the value is null or undefined.
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}


//aws
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

const addProducts = async function (req, res) {
    try {
        let data = JSON.parse(req.body.body)

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "Provide Product Image" })
        }
        data.productImage = uploadedFileURL


        if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "Enter Title" })
        let usedTille = await productModel.findOne({ title: data.title })
        console.log(usedTille)
        if (usedTille) return res.status(400).send({ status: false, msg: "Title already Present" })
        if (!isValid(data.description)) return res.status(400).send({ status: false, msg: "Enter description" })
        if (data.price < 0) return res.status(400).send({ status: false, msg: "Bad Price" })
        if (!(/INR/.test(data.currencyId))) return res.status(400).send({ status: false, msg: "Bad CurrencyId" })
        if (!(/₹/.test(data.currencyFormat))) return res.status(400).send({ status: false, msg: "Bad CurrencyFormat" })
        if (data.availableSizes.length <= 0) return res.status(400).send({ status: false, msg: "Add Sizes" })
        if (data.installments < 0) return res.status(400).send({ status: false, msg: "Bad Installments Field" })


        let created = await productModel.create(data)
        res.status(201).send({ status: true, msg: "Success", data: created })


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const getProducts = async function (req, res) {
    try {
        if (Object.keys(req.query).length == 0) {
            let allProducts = await productModel.find({ isDeleted: false })
            return res.status(200).send({ status: true, data: allProducts })
        }
        else {
            let size = req.query.size ?? ["S", "XS", "M", "X", "L", "XXL", "XL"]
            let title = req.query.name ?? /[A-Za-z0-9]/
            let priceGreaterThan = Number(req.query.priceGreaterThan) ?? 0
            let priceLessThan = Number(req.query.priceLessThan) ?? Infinity

            if (req.query.size) {
                if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(req.query.size) == -1) return res.status(400).send({ status: false, msg: "Size field is Invalid" })
            }
            if (!isValid(title)) return res.status(400).send({ status: false, msg: "Title Field should be Valid" })
            if (!isValid(priceGreaterThan)) {
                return res.status(400).send({ status: false, message: "priceGreaterThan is required" })
            }
            if (!/^[0-9]+$/.test(priceGreaterThan)) {
                return res.status(400).send({ status: false, message: "please enter number value at priceGreaterThan field" })
            }
            if (!isValid(priceLessThan)) {
                return res.status(400).send({ status: false, message: "priceGreaterThan is required" })
            }
            console.log(req.query.priceGreaterThan);
            if (!/^[0-9]+$/.test(priceLessThan)) {
                return res.status(400).send({ status: false, message: "please enter number value at priceLessThan field" })
            }


            let regexTitle = new RegExp(title, 'ig')

            if (req.query.priceSort == 1 || req.query.priceSort == -1) {
                var allProducts = await productModel.find({ $and: [{ title: regexTitle }, { availableSizes: { $in: size } }, { price: { $gt: priceGreaterThan } }, { price: { $lt: priceLessThan } }, { isDeleted: false }] }).collation({ locale: "en", strength: 2 }).sort({ price: req.query.priceSort })
            }
            if (req.query.priceSort == undefined) {
                var allProducts = await productModel.find({ $and: [{ title: regexTitle }, { availableSizes: { $in: size } }, { price: { $gt: priceGreaterThan } }, { price: { $lt: priceLessThan } }, { isDeleted: false }] }).collation({ locale: "en", strength: 2 })
            }
            if (allProducts.length == 0)
                return res.status(400).send({ status: false, message: "No books with selected query params" })

            res.status(200).send({ status: true, message: `Books List`, data: allProducts })
        }


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const deleteProduct = async function(req, res){
    try{
        let productId = req.params.productId
        if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status : false, msg : "Invalid ObjectId"})

        let findProd = await productModel.findOne({_id:productId, isDeleted : false})
        if(!findProd) return res.status(404).send({status :false, msg : "No Product found or already Deleted"})

        let deleteProd = await productModel.findOneAndUpdate({_id : productId}, {isDeleted : true, deletedAt : Date.now()}, {new : true})
        res.status(200).send({status : true, msg : "Success", data : deleteProd})

    }catch(err){
        res.status(500).send({status : false, msg : err.message})
    }
}


//### PUT /products/:productId
//- Updates a product by changing at least one or all fields

const updateDetails = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { fname, lname, password, email, phone, profileImage } = data
        if (!validation.validObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid type of userId" })
        }
        // if(userId != req.userid){
        //     return res.status(400).send({ status: false, message: "unauthorized user" })
        // }

        if (!validation.validBody(data)) {
            return res.status(400).send({ status: false, message: "please provide data to update" })
        }
        let user = await userModel.findById({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, message: "No user found" })
        }

        // taking input to update

        if ((fname && !validation.isValid(fname)) || fname == "") {
            return res.status(400).send({ status: false, message: "please enter Fname" })
        }

        if ((lname && !validation.isValid(lname)) || lname == "") {
            return res.status(400).send({ status: false, message: "please enter lname" })
        }
        // email
        if ((email && !validation.isValid(email)) || email == "") {
            return res.status(400).send({ status: false, message: "please enter email" })
        }
        if (email && !validation.emailValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter Valid Email" })
        }

        if ((phone && !validation.isValid(phone)) || phone == "") {
            return res.status(400).send({ status: false, message: "please enter Phone number" })
        }
        if (phone && !validation.mobileValid(phone)) {
            return res.status(400).send({ status: false, message: "please enter valid Indian mobile number" })
        }
        let exist = await userModel.findOne({ email: email, phone: phone })
        if (exist) {
            return res.status(400).send({ status: false, message: "Already Exists" })
        }

        if ((password && !validation.isValid(password)) || password == "") {
            return res.status(400).send({ status: false, message: "password is required" })
        }
        if (password && (!password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Password minimum length is 8 and maximum is 15." })
        }
        if (password) {
            let newHashPass = await bcrypt.hash(data.password, 10)
            password = newHashPass
        }
        
        let files = req.files
        if ((files && files.length > 0) ) {

            let uploadedFileURL = await validation.uploadFile(files[0])
            profileImage = uploadedFileURL
        }

        let arr = Object.values(data)
        for(let i = 0;i<arr.length;i++){
            if(!validation.isValid(arr[i])) return res.status(400).send({status : false, msg : "Bad request Field"})
        }
        let keys = Object.keys(data)
        if(keys.indexOf("address") !== -1) return res.status(400).send({status : false, msg : "please specify what to change, either shipping or billing"})

        let badAddressFormat = keys.find((key) => /^address\.(billing|shipping)\.(street|city|pincode)$/.test(key))
        console.log(badAddressFormat, keys)
        if(!badAddressFormat) return res.status(400).send({status:false, msg : "address field must be right"})
        


        let updadeData = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })
        return res.status(200).send({ data: updadeData })


    }
    catch (error) {
        return res.status(500).send({ status: false, err: error.message })
    }

}


module.exports = { addProducts, getProducts, deleteProduct, updateDetails }