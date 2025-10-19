const express = require("express");
const corsMiddleware = require("./middleware/cors");
const errorHandler = require("./middleware/error-handler");
const registerRoutes = require("./routes");
const { port } = require("./config/env");

const app = express();

app.use(express.json());
app.use(corsMiddleware);

registerRoutes(app);

app.use(errorHandler);

const start = () =>
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

module.exports = { app, start };
