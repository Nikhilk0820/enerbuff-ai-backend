const multer = require("multer");
const { maxUploadBytes } = require("../config/env");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes },
});

module.exports = upload;
