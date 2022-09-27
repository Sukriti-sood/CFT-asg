const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600,// this is the expiry time in seconds
    },
  });


module.exports = mongoose.model("Token", tokenSchema);