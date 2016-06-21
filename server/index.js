import express from "express";
import path from "path";
import devMode from "./dev-mode";
import SegmentHandler from "./handler";
import handlers from "./events";
import jwt from "jwt-simple";
import Analytics from "analytics-node";
import updateUser from "./update-user";
import ejs from "ejs";

const noop = function noop() {};

module.exports = function server(options = {}) {
  const { Hull, hostSecret } = options;
  const { NotifHandler, Routes, Middlewares } = Hull;
  const { hullClient } = Middlewares;
  const { Readme, Manifest } = Routes;
  const app = express();

  if (options.devMode) {
    app.use(devMode());
  }


  app.engine("html", ejs.renderFile);
  app.set("views", `${__dirname}/views`);
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


  app.post("/notify", NotifHandler({
    groupTraits: false,
    handlers: {
      "user:update": updateUser(Analytics)
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
  app.use((err, req, res, next) => {
    console.log("Error ----------------", err.message, err.status);
    return res.status(err.status || 500).send({ message: err.message });
  });

  app.exit = () => segment.exit();

  return app;
};
