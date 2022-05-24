const express = require('express')
const router = express.Router()

const { postRegister } = require('../controllers/userController')


router.post('/register', postRegister)













/*------------------------------------------if api is invalid OR wrong URL----------------------------------------------------------*/

router.all("/**", function (req, res) {
    res.status(404).send({ status: false, msg: "The api you request is not available" })
})

module.exports = router