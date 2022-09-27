const express = require('express')
const router = express.Router();

const {    
  register,
  resendOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  login} =require("../controller/auth")




  router.post("/register", register)

  router.post("/resend-otp", resendOtp);

  router.post("/verifyOtp", verifyOtp)

  router.post("/initpassrest", requestPasswordReset)

  router.patch("/resetpass", resetPassword)

  router.post("/login", login)

module.exports = router