const mongoose = require ('mongoose')


const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true,
        required: "First Name is required"
    },
    lname: {
        type: String,
        trim: true,
        required: "Last Name is required",
    },
    email: {
        type: String,
        trim: true,
        required: "email is required",
        unique: true
    },
    profileImage: {
        type: String,
        required: "Profile Image is required"
    },
    phone: {
        type: String,
        trim: true,
        required: "phone number is required",
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: "password is required"
    },
    address: {
        shipping: {
            street: {
                type: String,
                trim: true,
                required: true
            },
            city: {
                type: String,
                trim: true,
                required: true
            },
            pincode: {
                type: Number,
                trim: true,
                required: true
            }
        },
        billing: {
            street: {
                type: String,
                trim: true,
                required: true
            },
            city: {
                type: String,
                trim: true,
                required: true
            },
            pincode: {
                type: Number,
                trim: true,
                required: true
            }
        }
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('User', userSchema)