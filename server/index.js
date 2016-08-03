/* eslint global-require: 0 */

if (process.env.NEW_RELIC_LICENSE_KEY) {
  console.warn("Starting newrelic agent with key: ", process.env.NEW_RELIC_LICENSE_KEY);
  require("newrelic");
}

const Hull = require("hull");
const Server = require("./server");

const PORT = process.env.PORT || 8082;

const options = {
  Hull,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
};

Hull.onLog(function onLog(message, data, ctx) {
  console.log(`[${ctx.id}] segment.${message}`, JSON.stringify(data));
});
Hull.onMetric(function onMetric(metric, value, ctx) {
  console.log(`[${ctx.id}] segment.${metric}`, value);
});

if (process.env.LIBRATO_TOKEN && process.env.LIBRATO_USER) {
  const librato = require("librato-node");
  librato.configure({
    email: process.env.LIBRATO_USER,
    token: process.env.LIBRATO_TOKEN
  });
  librato.on("error", function onError(err) {
    console.error(err);
  });

  process.once("SIGINT", function onSigint() {
    librato.stop(); // stop optionally takes a callback
  });
  librato.start();

  Hull.onLog(function onLog(message, data = {}, ctx = {}) {
    try {
      const payload = typeof(data) === "object" ? JSON.stringify(data) : data;
      console.log(`[${ctx.id}] ${message}`, payload);
    } catch (err) {
      console.log(err);
    }
  });

  Hull.onMetric(function onMetricProduction(metric = "", value = 1, ctx = {}) {
    try {
      if (librato) {
        librato.measure(`segment.${metric}`, value, Object.assign({}, { source: ctx.id }));
      }
    } catch (err) {
      console.warn("error in librato.measure", err);
    }
  });
}

const app = Server(options);

function exitNow() {
  console.warn("Exiting now !");
  process.exit();
}

function handleExit() {
  console.log("Exiting... waiting 30 seconds workers to flush");
  setTimeout(exitNow, 30000);
  app.exit().then(exitNow);
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

console.log(`Listening on port ${PORT}`);
app.listen(PORT);
