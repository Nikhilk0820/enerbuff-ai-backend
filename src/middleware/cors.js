const cors = require("cors");
const { corsOrigins } = require("../config/env");

const corsMatchers = corsOrigins.map((origin) => {
  if (origin === "*") {
    return { type: "all" };
  }
  if (origin.startsWith("*.")) {
    return { type: "wildcard", value: origin.slice(1).toLowerCase() };
  }
  return { type: "exact", value: origin.toLowerCase() };
});

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = origin.toLowerCase();
  return corsMatchers.some((matcher) => {
    if (matcher.type === "all") return true;
    if (matcher.type === "exact") return matcher.value === normalizedOrigin;
    if (matcher.type === "wildcard") {
      return normalizedOrigin.endsWith(matcher.value);
    }
    return false;
  });
};

module.exports = cors({
  origin:
    corsMatchers.length > 0
      ? (origin, callback) => {
          if (isOriginAllowed(origin)) {
            return callback(null, true);
          }
          console.warn(
            `CORS origin not allowed: ${origin}. Allowed: ${corsOrigins.join(", ")}`,
          );
          return callback(new Error("CORS origin not allowed"));
        }
      : true,
  credentials: true,
});

module.exports.isOriginAllowed = isOriginAllowed;
