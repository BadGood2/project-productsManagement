const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refs: 'User',
    required: true
  },
  items: [{
      _id : false,
    productId: { type: mongoose.Schema.Types.ObjectId,refs:'Product',required: true },
    quantity: { type: Number, required: true }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  }
}, { timestamps: true })



module.exports = mongoose.model('Cart', cartSchema)