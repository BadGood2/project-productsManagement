const express = require('express')
const router = express.Router()
const auth = require("../Middlewares/auth")

const { postRegister, userLogin, getProfileData, updateProfile } = require('../controllers/userController')
const { addProducts, getProducts } = require("../controllers/productController")

router.post('/register', postRegister)

router.post('/login', userLogin)

router.get("/user/:userId/profile",auth.authentication, getProfileData)

router.put("/user/:userId/profile", auth.authentication, auth.authorization, updateProfile)

//PRODUCT API'S

router.post("/products", addProducts)

router.get("/products", getProducts)






/*------------------------------------------if api is invalid OR wrong URL----------------------------------------------------------*/

router.all("/**", function (req, res) {
    res.status(404).send({ status: false, msg: "The api you request is not available" })
})

module.exports = router