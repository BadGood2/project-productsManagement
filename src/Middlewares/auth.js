const jwt = require("jsonwebtoken")
const secret = "Product Management project group-30."
const exp = '360000s'

const decodeToken = (token) => {
    return jwt.verify(token, secret, (err, data) => {
        if (err)
            return null
        else
            return data
    })
}

const authentication = async function(req, res, next){
    try{
        

        let { authorization: token } = req.headers
        if (!token) return res.status(404).send({ status: false, msg: "Wrong User, add token fool!" })
        token = token.slice(token.indexOf(" ") + 1)

        let verifyToken = decodeToken(token)
        if(!verifyToken)
            return res.status(401).send({
                status: false,
                message: "Token is either Invalid or Expired. User Must log in with Valid details."
            })
        next()

    }catch(err){
        res.status(500).send({status : false, msg : err.message})
    }
}

const authorization = async function(req, res, next){
    try{
        let { authorization: token } = req.headers
        token = token.slice(token.indexOf(" ") + 1)

        let verifyToken = decodeToken(token)
        let userId = req.params.userId

        if(verifyToken.userId !== userId) return res.status(401).send({status : false, message : "Not Authorized"})
        next()

    }catch(err){
        res.status(500).send({status : false, msg : err.message})
    }
}

module.exports = {authentication, authorization}