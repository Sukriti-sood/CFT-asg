const express = require('express')
const router = express.Router();

const User = require("../models/user")

router.get("/:userId", async(req, res)=>{
    const userId = req.params.userId;
    const user = await User.findById(userId).select("-password");
    res.status(200).json(user)
})

router.get("/", async(req, res)=>{
    const users = await User.find().select("-password");
    res.status(200).json(users)
})

router.delete("/remove", async(req, res)=>{
    try{

        const userId = req.body.userId;
        await User.findByIdAndDelete(userId);
        res.status(200).send("User removed")
    }catch(err){
        req.status(400).json({error: err})
    }
})

module.exports = router