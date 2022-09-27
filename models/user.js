const mongoose = require('mongoose')

const userSchema =  new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        lowercase: true,
    },

    firstname: {
        type: String,
        trim: true,
        required: true
    },

    lastname: {
        type: String,
        trim: true,
        required: true        
    },

    password: {
        type: String,
        required: true,
    },
    
    verified: {
        type: Boolean,
        required: true,
        default: false
    }
},{timestamps: true})

module.exports = mongoose.model('User', userSchema);