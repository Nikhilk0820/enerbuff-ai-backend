const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");
const {
  parseInteger,
  defaultHistoryLimit,
  maxHistoryLimit,
  eventTypes,
  eventTypeSet,
} = require("../config/env");
const { mapHistoryRow } = require("../utils/history");

const router = express.Router();

router.get("/events/history", auth, async (req, res) => {
  try {
    const { userId: userIdRaw, limit: limitRaw, offset: offsetRaw } =
      req.query || {};

    let targetUserId;
    if (userIdRaw !== undefined) {
      const parsedUserId = parseInteger(userIdRaw);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        return res
          .status(400)
          .json({ error: "Invalid userId query parameter" });
      }
      if (parsedUserId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Cannot access history for another user" });
      }
      targetUserId = parsedUserId;
    } else {
      targetUserId = req.user.userId;
    }

    let limit = defaultHistoryLimit;
    if (limitRaw !== undefined) {
      const parsedLimit = parseInteger(limitRaw);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        return res
          .status(400)
          .json({ error: "limit must be a positive integer" });
      }
      limit = Math.min(parsedLimit, maxHistoryLimit);
    }

    let offset = 0;
    if (offsetRaw !== undefined) {
      const parsedOffset = parseInteger(offsetRaw);
      if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
        return res
          .status(400)
          .json({ error: "offset must be a non-negative integer" });
      }
      offset = parsedOffset;
    }

    const { rows } = await pool.query(
      `
        SELECT
          id,
          user_id AS "userId",
          user_name AS "userName",
          action,
          event_type AS "eventType",
          triggered_at AS "triggeredAt",
          ener_coins_used AS "enerCoinsUsed"
        FROM events_history
        WHERE user_id = $1
        ORDER BY triggered_at DESC
        LIMIT $2 OFFSET $3
      `,
      [targetUserId, limit, offset],
    );

    return res.json({ entries: rows.map(mapHistoryRow) });
  } catch (err) {
    console.error("History fetch error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/events/history", auth, async (req, res) => {
  try {
    const { userId, userName, action, eventType, enerCoinsUsed, triggeredAt } =
      req.body || {};

    const parsedUserId = parseInteger(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ error: "userId must be a positive integer" });
    }

    if (req.user.userId !== parsedUserId) {
      return res
        .status(403)
        .json({ error: "Cannot record history for another user" });
    }

    const trimmedName =
      typeof userName === "string" ? userName.trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ error: "userName is required" });
    }

    const trimmedAction =
      typeof action === "string" ? action.trim() : "";
    if (!trimmedAction) {
      return res.status(400).json({ error: "action is required" });
    }

    const normalizedEventType =
      typeof eventType === "string" ? eventType.trim() : "";
    if (!normalizedEventType) {
      return res.status(400).json({ error: "eventType is required" });
    }

    if (
      eventTypeSet.size > 0 &&
      !eventTypeSet.has(normalizedEventType.toLowerCase())
    ) {
      return res.status(400).json({
        error: `eventType must be one of: ${eventTypes.join(", ")}`,
      });
    }

    const parsedEnerCoinsUsed = parseInteger(enerCoinsUsed);
    if (!Number.isInteger(parsedEnerCoinsUsed) || parsedEnerCoinsUsed < 0) {
      return res
        .status(400)
        .json({ error: "enerCoinsUsed must be a non-negative integer" });
    }

    let timestamp = new Date();
    if (triggeredAt !== undefined) {
      const candidate = new Date(triggeredAt);
      if (Number.isNaN(candidate.getTime())) {
        return res
          .status(400)
          .json({ error: "triggeredAt must be a valid datetime" });
      }
      timestamp = candidate;
    }

    const isoTimestamp = timestamp.toISOString();

    const {
      rows: [saved],
    } = await pool.query(
      `
        INSERT INTO events_history
          (user_id, user_name, action, event_type, triggered_at, ener_coins_used)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          user_id AS "userId",
          user_name AS "userName",
          action,
          event_type AS "eventType",
          triggered_at AS "triggeredAt",
          ener_coins_used AS "enerCoinsUsed"
      `,
      [
        parsedUserId,
        trimmedName,
        trimmedAction,
        normalizedEventType,
        isoTimestamp,
        parsedEnerCoinsUsed,
      ],
    );

    return res.status(201).json(mapHistoryRow(saved));
  } catch (err) {
    console.error("History insert error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
