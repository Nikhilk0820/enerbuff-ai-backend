const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");
const { parseInteger } = require("../config/env");

const router = express.Router();

router.get("/users/:id/credits", auth, async (req, res) => {
  const userId = parseInteger(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const {
      rows: [row],
    } = await pool.query(
      "SELECT id, credits FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );

    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ userId: row.id, credits: row.credits });
  } catch (err) {
    console.error("Fetch credits error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/users/:id/credits", auth, async (req, res) => {
  const userId = parseInteger(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  if (req.user.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const amountValue = parseInteger(req.body?.amount);
  const creditsValue = parseInteger(req.body?.credits);
  let updatedUser;

  try {
    if (Number.isInteger(amountValue) && amountValue > 0) {
      const {
        rows: [row],
      } = await pool.query(
        "UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING id, credits",
        [amountValue, userId],
      );
      updatedUser = row;
    } else if (Number.isInteger(creditsValue) && creditsValue >= 0) {
      const {
        rows: [row],
      } = await pool.query(
        "UPDATE users SET credits = $1 WHERE id = $2 RETURNING id, credits",
        [creditsValue, userId],
      );
      updatedUser = row;
    } else {
      return res.status(400).json({
        error:
          "Provide a positive integer 'amount' to add or a non-negative integer 'credits' to set.",
      });
    }
  } catch (err) {
    console.error("Update credits error:", err);
    return res.status(500).json({ error: "Server error" });
  }

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({
    message: "Credits updated",
    user: { userId: updatedUser.id, credits: updatedUser.credits },
  });
});

module.exports = router;
