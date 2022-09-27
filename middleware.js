const jwt = require("jsonwebtoken");
const keys = require("./config/keys")

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];

    if (!token) {
      throw new Error("No token provided");
    }

    const {_id, email} = jwt.decode(token, keys.JWT_Secret);

    req.body = {
      ...req.body,
      email
    };

    return next();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};


module.exports = { verifyToken,};