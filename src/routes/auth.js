const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const {
  isValidEmail,
  isValidMobile,
  isStrongPassword,
} = require("../utils/validation");
const { signToken } = require("../utils/token");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    let { firstName, lastName, email, mobile, state, password } = req.body || {};
    firstName = (firstName || "").trim();
    lastName = (lastName || "").trim();
    email = (email || "").trim().toLowerCase();
    mobile = (mobile || "").trim();
    state = (state || "").trim();

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "First and last name are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({ error: "Mobile must be 10-15 digits" });
    }

    if (!state) {
      return res.status(400).json({ error: "State is required" });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const { rows: existingUsers } = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR mobile = $2 LIMIT 1",
      [email, mobile],
    );

    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ error: "Email or mobile already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const insertResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, mobile, state, password_hash, credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [firstName, lastName, email, mobile, state, passwordHash, 30],
    );

    const userId = insertResult.rows[0]?.id;
    if (!userId) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    const token = signToken({ userId, email });

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: userId,
        firstName,
        lastName,
        email,
        mobile,
        state,
        credits: 30,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = (email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const {
      rows: [user],
    } = await pool.query(
      `SELECT id, first_name, last_name, email, mobile, state, credits, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        mobile: user.mobile,
        state: user.state,
        credits: user.credits,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
