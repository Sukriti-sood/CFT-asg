const express = require('express')
const router = express.Router();
const { verifyToken} = require("../middleware");

router.get("/", (req, res)=>{
  res.status(200).json({success: "true", message: "Running"})
})

router.get("/privateRoute", verifyToken, (req, res)=>{
  const {email} = req.body
  if(email){
    res.status(200).send(`User with ${email} enters the private Route`);
  }res.status(403).send("Unauthourized Request")
})

module.exports = router