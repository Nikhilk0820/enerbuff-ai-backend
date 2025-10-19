const { Pool } = require("pg");
const { databaseConfig } = require("./env");

const pool = new Pool(databaseConfig);

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
  process.exitCode = 1;
});

module.exports = pool;
