const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey"; 

exports.signToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};  