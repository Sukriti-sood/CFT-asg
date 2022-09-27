const mongoose = require('mongoose')

const OtpSchema = new mongoose.Schema({

    otp: {
        type: Number,
        required: true,
    },

    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300,// this is the expiry time in seconds
      },
})

module.exports = mongoose.model("OTP", OtpSchema)