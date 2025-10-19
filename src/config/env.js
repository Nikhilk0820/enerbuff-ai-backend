const dotenv = require("dotenv");

dotenv.config();

const parseInteger = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInteger(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const port = parsePositiveInt(process.env.PORT, 3000);

const defaultHistoryLimit = parsePositiveInt(
  process.env.DEFAULT_HISTORY_LIMIT,
  20,
);

const maxHistoryLimit = parsePositiveInt(process.env.MAX_HISTORY_LIMIT, 100);

const maxUploadBytes = parsePositiveInt(
  process.env.MAX_UPLOAD_BYTES,
  10 * 1024 * 1024,
);

const configuredEventTypes = (process.env.EVENT_TYPES || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const eventTypes =
  configuredEventTypes.length > 0
    ? configuredEventTypes
    : ["credits_added", "credits_used", "forecast_run"];

const eventTypeSet = new Set(eventTypes.map((value) => value.toLowerCase()));

const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedUploadExt = new Set(["csv", "xls", "xlsx"]);

const buildDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    const sslRequired =
      process.env.DATABASE_URL.includes("sslmode=require") ||
      process.env.PGSSLMODE === "require";

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    };
  }

  const sslRequired = process.env.PGSSLMODE === "require";

  return {
    host: process.env.PGHOST || "localhost",
    port: parsePositiveInt(process.env.PGPORT, 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  };
};

const databaseConfig = buildDatabaseConfig();

module.exports = {
  port,
  parseInteger,
  parsePositiveInt,
  defaultHistoryLimit,
  maxHistoryLimit,
  eventTypes,
  eventTypeSet,
  maxUploadBytes,
  corsOrigins,
  allowedUploadExt,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  databaseConfig,
};
