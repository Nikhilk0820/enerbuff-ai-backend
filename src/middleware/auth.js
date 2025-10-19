const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server error" });
    }

    const payload = jwt.verify(token, jwtSecret);
    if (
      !payload ||
      typeof payload.userId !== "number" ||
      payload.userId <= 0
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = { userId: payload.userId, email: payload.email };
    return next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = auth;
