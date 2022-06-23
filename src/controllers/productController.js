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
        let data = req.body

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

        let usedTitle = await productModel.findOne({ title: data.title })
        if (usedTitle) return res.status(400).send({ status: false, msg: "Title already Present" })
        
        if (!isValid(data.description)) return res.status(400).send({ status: false, msg: "Enter description" })
        if (data.price < 0) return res.status(400).send({ status: false, msg: "Bad Price" })
        if (!(/^(INR)$/.test(data.currencyId))) return res.status(400).send({ status: false, msg: "Bad CurrencyId" })
        if (!(/^(₹)$/.test(data.currencyFormat))) return res.status(400).send({ status: false, msg: "Bad CurrencyFormat" })
        if (data.availableSizes.length == 0) return res.status(400).send({ status: false, msg: "Add Sizes" })
        if (data.installments < 0) return res.status(400).send({ status: false, msg: "Bad Installments Field" })

        data.availableSizes = JSON.parse(data.availableSizes)
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
            let priceGreaterThan = req.query.priceGreaterThan ?? 0
            let priceLessThan = req.query.priceLessThan ?? 9999999999
            

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
            
            if (!/^[0-9]+$/.test(priceLessThan)) {
                return res.status(400).send({ status: false, message: "please enter number value at priceLessThan field" })
            }


            let regexTitle = new RegExp(title, 'ig')

            if (req.query.priceSort == 1 || req.query.priceSort == -1) {
                var allProducts = await productModel.find({ $and: [{ title: regexTitle }, { availableSizes: { $in: size } }, { price: { $gt: priceGreaterThan } }, { price: { $lt: priceLessThan } }, { isDeleted: false }] }).sort({ price: req.query.priceSort })
            }
            if (req.query.priceSort == undefined) {
                var allProducts = await productModel.find({ $and: [{ title: regexTitle }, { availableSizes: { $in: size } }, { price: { $gt: priceGreaterThan } }, { price: { $lt: priceLessThan } }, { isDeleted: false }] })
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

//GET products BY ID

const getProductsById = async function (req, res) {
    try {

        let productId = req.params.productId
        let profileData = await productModel.findById({ _id: productId })
        if (!profileData) return res.status(400).send({ status: false, msg: "No record found with that UserID" })

        res.status(200).send({ status: true, msg: "User profile Data", data: profileData })



    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

// ### PUT /products/:productId
// - Updates a product by changing at least one or all fields
// - Check if the productId exists (must have isDeleted false and is present in collection)

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if(!validation.validObjectId(productId)) return res.status(400).send({status : false, msg : "ProductId is not valid ObjectId"})

        let productExists = await productModel.findById({_id: productId})
        if(!productExists) return res.status(404).send({status : false, msg : "product does not exists"})

        let data = req.body
        
        if(data?.title){
            if(!isValid(data.title)) return res.status(400).send({status:false,msg:"BAD title field"})
            let titleExists = await productModel.findOne({title : data.title})
            if(titleExists) return res.status(400).send({status:false,msg:"Title already been used, choose another title"})
        }
        if(data?.description){
            if(!isValid(data.description)) return res.status(400).send({status:false,msg:"BAD description field"})
        }
        if(data?.price || data.price == 0){
            if(!isValid(data.price)) return res.status(400).send({status:false,msg:"BAD price field"})
            data.price = JSON.parse(data.price)
            if(data.price < 0 || typeof data.price !== typeof 1) return res.status(400).send({status:false,msg:"BAD price value"})
        }
        if(data?.isFreeShipping){
            data.isFreeShipping = JSON.parse(data.isFreeShipping)
            if(typeof data.isFreeShipping !== typeof false) return res.status(400).send({status:false,msg:"Expects a boolean value at isFreeShipping field"})
        }
        let files = req.files
        if(files && files.length > 0){
            let uploadedFileURL = await uploadFile(files[0])
            data.productImage = uploadedFileURL
        }
        if(data?.style){
            if(!isValid(data.style)) return res.status(400).send({status:false,msg:"BAD style field"})
        }
        if(data?.availableSizes){
            if(!isValid(data.availableSizes)) return res.status(400).send({status:false,msg:"BAD availableSizes field"})
            data.availableSizes = JSON.parse(data.availableSizes)
            if(typeof data.availableSizes !== typeof []) return res.status(400).send({status:false,msg:"availableSizes field expects an array"})
        }
        if(data?.installments){
            if(!isValid(data.installments)) return res.status(400).send({status:false,msg:"BAD installments field"})
            data.installments = JSON.parse(data.installments)
            if(data.installments < 0 || typeof data.installments !== typeof 2) return res.status(400).send({status:false,msg:"BAD installments value"})
        }

        let updatedProduct = await productModel.findOneAndUpdate({_id : productId}, data, {new : true})
        return res.status(200).send({status : true, productDetails : updatedProduct})     

        }
    catch (error) {
        return res.status(500).send({ status: false, err: error.message })
    }

}


module.exports = { addProducts, getProducts, deleteProduct, updateProduct, getProductsById }