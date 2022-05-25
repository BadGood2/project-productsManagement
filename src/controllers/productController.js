const productModel = require("../models/productModel")
const aws = require('aws-sdk')


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
            let size = req.query.size ?? ["S", "XS","M","X", "L","XXL", "XL"]
            let title = req.query.name ?? /[A-Za-z0-9]/
            let priceGreaterThan = req.query.priceGreaterThan ?? 0
            let priceLessThan = req.query.priceLessThan ?? Infinity

            let regexTitle = new RegExp(title, 'ig')


            let allProducts = await productModel.find({ $and: [{ title : regexTitle }, { availableSizes : {$in : size} }, {price : {$gt : priceGreaterThan}}, {price : {$lt : priceLessThan}}, { isDeleted: false }] }).collation({ locale: "en", strength: 2 })

            if (allProducts.length == 0)
                return res.status(400).send({ status: false, message: "No books with selected query params" })

            res.status(200).send({ status: true, message: `Books List`, data: allProducts })
        }


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { addProducts, getProducts }