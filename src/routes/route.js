const express = require('express')
const router = express.Router()
const auth = require("../Middlewares/auth")

const { postRegister, userLogin, getProfileData, updateProfile } = require('../controllers/userController')
const { addProducts, getProducts, deleteProduct, updateDetails } = require("../controllers/productController")
const { postCart, removeProduct } = require('../controllers/cartController')
const { postOrder, updateOrder } = require('../controllers/orderController')

router.post('/register', postRegister)

router.post('/login', userLogin)

router.get("/user/:userId/profile",auth.authentication, getProfileData)

router.put("/user/:userId/profile", auth.authentication, auth.authorization, updateProfile)

router.put("/user/:userId/profile", updateDetails)
//PRODUCT API'S

router.post("/products", addProducts)

router.get("/products", getProducts)

router.delete("/products/:productId", deleteProduct)

//CART API's

router.post("/users/:userId/cart",/*auth.authentication, auth.authorization,*/ postCart)

router.put("/users/:userId/cart",/*auth.authentication, auth.authorization,*/ removeProduct)

//ORDER API's

router.post("/users/:userId/orders",auth.authentication, auth.authorization, postOrder)

router.put("/users/:userId/orders",auth.authentication, auth.authorization, updateOrder)

/*------------------------------------------if api is invalid OR wrong URL----------------------------------------------------------*/

router.all("/**", function (req, res) {
    res.status(404).send({ status: false, msg: "The api you request is not available" })
})

module.exports = router