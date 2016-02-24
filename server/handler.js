import connect from 'connect';
import https from 'https';
import _ from 'lodash';
import rawBody from 'raw-body';
import Hull from 'hull';
import crypto from 'crypto'


function parseRequest() {
  return function(req, res, next) {
    req.hull = req.hull || {};
    rawBody(req, true, (err, body) => {
      if (err) {
        return res.handleError('Invalid body', 400);
      }
      try {
        req.hull.body = body;
        req.hull.message = JSON.parse(body);
      } catch (parseError) {
        return res.handleError('Invalid body', 400);
      }
      return next();
    });
  };
}


function verifySignature(options = {}) {
  return (req, res, next) => {
    if (!options.sharedSecret) {
      return next();
    }
    const signature = req.headers['x-signature'];

    if (!signature) {
      return res.handleError('Missing signature', 403);
    }

    const digest = crypto
      .createHmac('sha1', options.sharedSecret)
      .update(req.hull.body)
      .digest('hex');

    if (signature == digest) {
      next()
    } else {
      res.handleError('Invalid signature with secret="' + options.sharedSecret + '"', 403);

      next();
    }
  }
}

function enrichWithHullClient() {
  var _cache = [];

  function getCurrentShip(shipId, client, forceUpdate) {
    if (forceUpdate) _cache[shipId] = null;
    _cache[shipId] = _cache[shipId] || client.get(shipId);
    return _cache[shipId];
  }

  return function(req, res, next) {
    const config = ['organization', 'ship', 'secret'].reduce((cfg, k)=> {
      const val = (req.query[k] || "").trim();
      if (typeof val === 'string') {
        cfg[k] = val;
      } else if (val && val[0] && typeof val[0] === 'string') {
        cfg[k] = val[0].trim();
      }
      return cfg;
    }, {});

    req.hull = req.hull || {};

    const { message } = req.hull;
    let forceShipUpdate = false;
    if (message && message.Subject === 'ship:update') {
      forceShipUpdate = true;
    }

    if (config.organization && config.ship && config.secret) {
      const client = req.hull.client = new Hull({
        orgUrl: 'https://' + config.organization,
        platformId: config.ship,
        platformSecret: config.secret
      });
      getCurrentShip(config.ship, client, forceShipUpdate).then((ship) => {
        req.hull.ship = ship;
        next();
      }, (err) => {
        res.handleError(err.toString(), 400);
      });
    } else {
      next();
    }
  };
}

function processHandlers(handlers) {
  return function(req, res, next) {
    try {
      const eventName = req.hull.message.type
      const eventHandlers = handlers[eventName];
      if (eventHandlers && eventHandlers.length > 0) {
        const context = {
          hull: req.hull.client,
          ship: req.hull.ship
        };

        const processors = eventHandlers.map(fn => fn(req.hull.message, context));

        Promise.all(processors).then(() => {
          next();
        }, (err) => {
          res.handleError('Failed to process message: ' + JSON.stringify(err, ' ', 2), 500);
        });
      } else {
        next();
      }
    } catch ( err ) {
      res.handleError(err.toString(), 500);
    }
  };
}


function errorHandler(onError) {
  return function(req, res, next) {
    res.handleError = function(message, status) {
      if (onError) onError(message, status);
      res.status(status);
      res.end(message);
    };
    next();
  };
}


module.exports = function SegmentHandler(options = {}) {
  const _handlers = {};
  const app = connect();

  function addEventHandlers(eventsHash) {
    _.map(eventsHash, (fn, eventName) => addEventHandler(eventName, fn));
    return this;
  }

  function addEventHandler(eventName, fn) {
    _handlers[eventName] = _handlers[eventName] || [];
    _handlers[eventName].push(fn);
    return this;
  }

  if (options.events) {
    addEventHandlers(options.events);
  }

  app.use(errorHandler(options.onError));
  app.use(parseRequest());
  app.use(verifySignature(options));
  app.use(enrichWithHullClient());
  app.use(processHandlers(_handlers));
  app.use((req, res) => { res.end('ok'); });

  function handler(req, res) {
    return app.handle(req, res);
  }

  handler.addEventHandler = addEventHandler;

  return handler;
};
