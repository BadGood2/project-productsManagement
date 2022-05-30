const orderModel = require("../models/orderModel")
const validation = require('../validator/validator')
const userModel = require("../models/userModel")
const productModel = require('../models/productModel')


// Make sure the userId in params and in JWT token match.
// - Make sure the user exist
// - Get cart details in the request body
const postOrder = async function (req, res) {
    try {
        if (!validation.validBody(req.body)) return res.status(400).send({ status: false, msg: "Empty or Bad Body" })
        let data = req.body
        if (!validation.validObjectId(req.params.userId)) return res.status(400).send({ status: false, msg: "Bad userId" })

        let userExist = await userModel.findById({ _id: req.params.userId })
        if (!userExist) return res.status(400).send({ status: false, msg: "UserId does not Exists" })
        let orderExists = await orderModel.findOne({ userId: req.params.userId })
        if (orderExists) return res.status(400).send({ status: false, msg: "Order already exists for this UserId" })

        data.items = JSON.parse(data.items)
        if (!Array.isArray(data.items)) return res.status(400).send({ status: false, msg: "Items field should be an Array, no double quotes" })


        let totalPrice = 0, totalQuantity = 0;
        for (let i = 0; i < data.items.length; i++) {
            let flag;
            let keys = Object.keys(data.items[i])
            keys.forEach((key) => {
                if (!/^(productId|quantity){1}$/.test(key)) {
                    flag = 'error'
                }
            })
            if (flag == 'error') return res.status(400).send({ status: false, msg: "Bad field inside Array" })

            let prodDetails = await productModel.findById({ _id: data.items[i].productId })
            if (!prodDetails) return res.status(400).send({ status: false, msg: "Error while fetching product Details" })

            if (!/^[0-9]+$/.test(data.items[i].quantity)) return res.status(400).send({ status: false, msg: "quantity field Invalid" })
                

            totalPrice += (data.items[i].quantity * prodDetails.price)
            totalQuantity += data.items[i].quantity
        }
        data.userId = req.params.userId
        data.totalPrice = totalPrice
        data.totalQuantity = totalQuantity
        data.totalItems = data.items.length

        if (data?.cancellable) {
            data.cancellable = JSON.parse(data.cancellable)
            if (typeof data.cancellable !== 'Boolean') return res.status(400).send({ status: false, msg: "cancellable field is invalid" })
        }

        if (data?.status) {
            if (!/^(pending|completed|canceled){1}$/) return res.status(400).send({ status: false, msg: "Takes a ENUM value " })
        }

        let orderCreate = await orderModel.create(data)
        res.status(201).send({ status: true, data: orderCreate })

    } catch (e) {
        res.status(500).send({ status: false, msg: e.message })
    }
}

const updateOrder = async function (req, res) {
    try {
        if (!validation.validBody(req.body)) return res.status(400).send({ status: false, msg: "Empty or Bad Body" })
        let data = req.body
        if (!validation.validObjectId(req.params.userId)) return res.status(400).send({ status: false, msg: "Bad userId" })

        let userExist = await userModel.findById({ _id: req.params.userId })
        if (!userExist) return res.status(400).send({ status: false, msg: "UserId does not Exists" })
        let orderExists = await orderModel.findOne({ userId: req.params.userId })
        if (!orderExists) return res.status(400).send({ status: false, msg: "Order does not exists for this UserId" })

        if (!validation.isValid(data.orderId)) return res.status(400).send({ status: false, msg: "Bad orderId" })

        if (!validation.validObjectId(data.orderId)) return res.status(400).send({ status: false, msg: "Bad orderId" })

        let orderValid = await orderModel.findById({ _id: data.orderId })
        if (orderValid.userId.toString() !== req.params.userId) return res.status(400).send({ status: false, msg: "UserId inside Order and in params do not match" })

        if (data.status == 'canceled') {
            if (!orderValid.cancellable) return res.status(400).send({ status: false, msg: "Order cannot be Canceled" })
            else {
                let updOrd = await orderModel.findOneAndUpdate({ _id: data.orderId }, { status: 'canceled' }, { new: true })
                return res.status(200).send({ status: true, data: updOrd })
            }
        }
        else if (data.status == 'completed') {
            let updOrd = await orderModel.findOneAndUpdate({ _id: data.orderId }, { status: 'completed' }, { new: true })
            return res.status(200).send({ status: true, data: updOrd })
        }

    } catch (e) {
        res.status(500).send({ status: false, msg: e.message })
    }
}

module.exports = { postOrder, updateOrder }