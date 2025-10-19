const multer = require("multer");
const { maxUploadBytes } = require("../config/env");

const errorHandler = (err, _req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `File exceeds the maximum allowed size of ${maxUploadBytes} bytes`,
      });
    }
    return res.status(400).json({ error: err.message || "Upload failed" });
  }

  if (err && err.message === "CORS origin not allowed") {
    return res.status(403).json({ error: "CORS origin not allowed" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Server error" });
};

module.exports = errorHandler;
