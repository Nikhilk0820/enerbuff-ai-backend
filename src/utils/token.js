const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

const signToken = (payload) => {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

module.exports = { signToken };
