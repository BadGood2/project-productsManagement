const aws = require('aws-sdk')
const mongoose = require('mongoose')


const isValid= function(value){
    if (typeof value==='undefined' || value===null)return false
    if (typeof value==='string' && value.trim().length===0)return false
    return true
}


const validBody= function(body){
    return Object.keys(body).length > 0 
}

const emailValid = function(email){
    return (/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,20}$/).test(email)
}

const mobileValid= function(mobile){
    return (/^((\+91?)?0?)?[6-9]\d{9}$/).test(mobile)
}

const validObjectId= function(objectId){
    return mongoose.Types.ObjectId.isValid(objectId)
}



let uploadFile= async ( file) =>{
    return new Promise( function(resolve, reject) {
     // this function will upload file to aws and return the link
     let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws
 
     var uploadParams= {
         ACL: "public-read",
         Bucket: "classroom-training-bucket",  //HERE
         Key: "abc/" + file.originalname, //HERE 
         Body: file.buffer
     }
 
 
     s3.upload( uploadParams, function (err, data ){
         if(err) {
             return reject({"error": err})
         }
         console.log(data)
         console.log("file uploaded succesfully")
         return resolve(data.Location)
     })
 
    })
 }

module.exports={isValid,validBody,emailValid,mobileValid,uploadFile,validObjectId}