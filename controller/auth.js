const User = require("../models/user")
const Otp = require("../models/otp")
const Token = require("../models/token")
const bcrypt = require('bcrypt')
const keys = require("./../config/keys")
const path = require("path")
const jwt = require("jsonwebtoken")
const {MAIL, MAIL_PASSWORD, MAIL_USERNAME, OAUTH_CLIENTID, OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN} = keys;

const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars')

const crypto = require("crypto");

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
      clientId: OAUTH_CLIENTID,
      clientSecret: OAUTH_CLIENT_SECRET,
      refreshToken: OAUTH_REFRESH_TOKEN
    }
  });

  const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
};

transporter.use('compile', hbs(handlebarOptions))

const register = async(req, res) => {
    try{
        const {email, firstname, lastname, password} = req.body;
        if (!(firstname && lastname && email && password)) {
            throw new Error("All input required");
          }

        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail }).select("-password");
        if(existingUser)
        {
            throw new Error("Email already in use");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email: normalizedEmail,
            firstname: firstname,
            lastname: lastname,
            password: hashedPassword
        })

        const otp = `${Math.floor(1000 + Math.random()*9000)}`;
        const filter = {userId: user._id};
        const update = {otp: otp}
        const optResponse = await Otp.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true 
          });


        let mailOptions = {
          from: MAIL,
          to: user.email,
          subject: 'Verify Email',
          template: 'email',
          context: {
            code: optResponse.otp,    
          }
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
              throw new Error(err);
            } else {
              res.status(201).json({'message':'Please check your Email inbox and Spam folder too.', user: {userId: user._id, email: user.email}})
            }
          });
    }catch(err)
    {
        console.log(err);
        res.status(400).json({error: err.message})
    }
}

const resendOtp = async(req, res)=>{
    try{

        const {userId} = req.body;
        const filter = {userId: userId};
        const otp = `${Math.floor(1000 + Math.random()*9000)}`;
        const update = {otp: otp}
        const user = await User.findById(userId).select("-password");
        console.log(user)
        if(user){

          const optResponse = await Otp.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true 
          });
        
          let mailOptions = {
            from: MAIL,
            to: user.email,
            subject: 'Verify Email',
            template: 'email',
            context: {
              code: optResponse.otp,    
            }
          };
  
          transporter.sendMail(mailOptions, function(err, data) {
              if (err) {
                throw new Error(err);
              } else {
                res.status(201).json({'message':'Please check your Email inbox and Spam folder too.', user: {userId: user._id, email: user.email}})
              }
            });
        }else throw Error("No user found")

    }catch(err)
    {
        console.log(err)
    }
}


const verifyOtp = async(req, res) =>{
    try{

        const {userId, otp} = req.body;

        let data = await Otp.findOne({userId: userId})
        if(!data)
        {
            throw new Error("OTP expires")
        }
        console.log(data)
        if(!(data.otp === otp)) throw new Error("Wrong OTP")

        const filter = {_id: userId};
        const update = {verified: true}
        const userResponse = await User.findOneAndUpdate(filter, update).select("-password");
        const token = jwt.sign({_id: userResponse._id, email: userResponse.email}, keys.JWT_Secret, {expiresIn: '1d'})

        res.status(200).json({message: "OTP verifies", token, firstname:userResponse.firstname, lastname: userResponse.lastname})
    }catch(err){
        console.log(err)
        res.status(400).json({errpr: err.message})
    }
}

const requestPasswordReset = async(req, res) => {
    try{
        const {email} = req.body;
        const user = await User.findOne({email: email}).select("-password");
        if(!user) throw new Error("User doesn't Exist")

        let token = await Token.findOne({userId: user._id})
        if(token) await token.deleteOne();


        let resetToken = crypto.randomBytes(32).toString("hex");
        const hash = await bcrypt.hash(resetToken, 10);

        await new Token({
            userId: user._id,
            token: hash,
            createdAt: Date.now(),
        }).save();

        const link = `clientURL/passwordReset?token=${resetToken}&id=${user._id}`;

        let mailOptions = {
            from: MAIL,
            to: user.email,
            subject: 'Verify Email',
            template: 'link',
            context: {
            href:link,   
            }
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
                throw new Error(err);
            } 
            });

            res.status(200).json({userId: user._id, token: resetToken})
    }catch(err)
    {
        console.log(err)
    }
}


const resetPassword = async(req, res) =>{
    try{
        const {userId, token, password} =req.body;
        let passwordResetToken = await Token.findOne({ userId });
        if (!passwordResetToken) {
            throw new Error("Invalid or expired password reset token");
        }
        const isValid = await bcrypt.compare(token, passwordResetToken.token);
        if (!isValid) {
            throw new Error("Invalid or expired password reset token");
          }
          const hashedPassword = await bcrypt.hash(password, 10);
          await User.updateOne(
            { _id: userId },
            { $set: { password: hashedPassword } },
            { new: true }
          ).select("-password");

          const user = await User.findById({ _id: userId }).select("-password");
          const jwtoken = jwt.sign({_id:user._id, email: user.email}, keys.JWT_Secret, {expiresIn: '1d'})
          res.status(201).json({token: jwtoken, user: { firstname: user.firstname, lastname: user.lastname}})
    }catch(err)
    {
        console.log(err)
    }
}

const login = async(req, res) =>{
    try{
    
    const { email, password } = req.body;

    if (!(email && password)) {
      throw new Error("All input required");
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail })


    if (!user) {
      throw new Error("Email or password incorrect");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid)throw new Error("Wrong Password")
    const jwtoken = jwt.sign({_id:user._id, email: user.email}, keys.JWT_Secret, {expiresIn: '1d'})
    res.status(200).json({token: jwtoken, user: { firstname: user.firstname, lastname: user.lastname}})
    
    }catch(err)
    {
        console.log(err)
    }
}

module.exports = {
    register,
    resendOtp,
    verifyOtp,
    requestPasswordReset,
    resetPassword,
    login
}