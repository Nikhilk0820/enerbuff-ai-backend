const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ status: "error" });
  }
});

module.exports = router;
