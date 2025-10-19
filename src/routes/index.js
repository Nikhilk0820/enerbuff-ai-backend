const authRoutes = require("./auth");
const usersRoutes = require("./users");
const eventsRoutes = require("./events");
const uploadsRoutes = require("./uploads");
const healthRoute = require("./health");

const registerRoutes = (app) => {
  app.use("/api", authRoutes);
  app.use("/api", usersRoutes);
  app.use("/api", eventsRoutes);
  app.use("/api", uploadsRoutes);
  app.use("/", healthRoute);
};

module.exports = registerRoutes;
