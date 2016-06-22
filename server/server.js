import express from "express";
import path from "path";
import devMode from "./dev-mode";
import SegmentHandler from "./handler";
import handlers from "./events";
import jwt from "jwt-simple";
import analyticsClientFactory from "./analytics-client";
import updateUser from "./update-user";
import ejs from "ejs";

module.exports = function server(options = {}) {
  const { Hull, hostSecret } = options;
  const { BatchHandler, NotifHandler, Routes, Middlewares } = Hull;
  const { hullClient } = Middlewares;
  const { Readme, Manifest } = Routes;
  const app = express();

  if (options.devMode) {
    app.use(devMode());
  }


  app.engine("html", ejs.renderFile);
  app.set("views", path.resolve(__dirname, "..", "views"));
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);

  app.get("/admin.html", hullClient(Hull, { fetchShip: false }), (req, res) => {
    const { config } = req.hull;
    const apiKey = jwt.encode(config, hostSecret);
    res.render("admin.html", { apiKey });
  });

  const analyticsClient = analyticsClientFactory();

  app.post("/notify", NotifHandler({
    groupTraits: false,
    handlers: {
      "user:update": updateUser(analyticsClient),
    }
  }));
  app.post("/batch", BatchHandler({
    groupTraits: false,
    handler: (notifications = [], context) => {
      notifications.map(n => updateUser(analyticsClient)(n, context));
    }
  }));

  const segment = SegmentHandler({
    onError(err) {
      console.warn("Error handling segment event", err, err && err.stack);
    },
    hostSecret,
    hullClient,
    Hull,
    handlers,
  });

  app.post("/segment", segment);

  // Error Handler
  app.use((err, req, res) => {
    console.log("Error ----------------", err.message, err.status);
    return res.status(err.status || 500).send({ message: err.message });
  });

  app.exit = () => segment.exit();

  return app;
};
