const express = require("express");
const path = require("path");
const pool = require("../config/database");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  parseInteger,
  maxUploadBytes,
  allowedUploadExt,
} = require("../config/env");

const router = express.Router();

router.post("/uploadcsv", auth, upload.single("file"), async (req, res) => {
  try {
    const body = req.body || {};
    const userIdRaw =
      body.userId ?? body.user_id ?? body.userID ?? req.user?.userId;
    const userId = parseInteger(userIdRaw);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "userId must be a positive integer" });
    }

    if (req.user.userId !== userId) {
      return res.status(403).json({ error: "Cannot upload for another user" });
    }

    const {
      rows: [user],
    } = await pool.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [userId]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ error: "file is required" });
    }

    const originalName = (file.originalname || "upload").trim() || "upload";
    const mimeType = file.mimetype || "application/octet-stream";
    const fileSize =
      typeof file.size === "number" && Number.isFinite(file.size)
        ? file.size
        : file.buffer.length;

    if (!fileSize) {
      return res.status(400).json({ error: "Uploaded file is empty" });
    }

    if (fileSize > maxUploadBytes) {
      return res.status(413).json({
        error: `File exceeds the maximum allowed size of ${maxUploadBytes} bytes`,
      });
    }

    const ext = path.extname(originalName).replace(/^\./, "").toLowerCase();
    if (!allowedUploadExt.has(ext)) {
      return res
        .status(400)
        .json({ error: "Only CSV or Excel files are allowed" });
    }

    const {
      rows: [uploadRow],
    } = await pool.query(
      `
        INSERT INTO user_uploads
          (user_id, original_name, mime_type, file_ext, file_size, file_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [userId, originalName, mimeType, ext, fileSize, file.buffer],
    );

    if (!uploadRow) {
      return res.status(500).json({ error: "Failed to store upload" });
    }

    return res.status(201).json({
      message: "File uploaded successfully",
      uploadId: uploadRow.id,
      fileName: originalName,
      fileSize,
    });
  } catch (err) {
    console.error("Upload CSV error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
