const express = require('express')
require("dotenv").config()
const mongoose = require('mongoose')

const indexRouter = require("./routes/index")
const authRouter =require("./routes/auth")
const userRouter = require("./routes/user")

const url = process.env.MONGOURI;
const connectWithRetry = () => {
    mongoose
      .connect(url, {
        dbName:"auth",
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log("succesfully connected to DB"))
      .catch((e) => {
        console.log(e);
        setTimeout(connectWithRetry, 5000);
      });
  };
  
  connectWithRetry();

  var app = express();
  const httpServer = require('http').createServer(app)



  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/", indexRouter);
  app.use("/auth", authRouter )
  app.use("/user", userRouter)

// Passport config

  httpServer.listen(process.env.PORT || 5000, ()=>{
    console.log("listening.....")
})