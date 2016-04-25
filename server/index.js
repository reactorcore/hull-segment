import express from 'express';
import path from 'path';
import Hull, { NotifHandler } from 'hull';
import devMode from './dev-mode';
import SegmentHandler from './handler';
import eventsHandlers from './events'
import jwt from 'jwt-simple';

const noop = function() {};


export default function(options) {

  const app = express();

  app.engine('html', require('ejs').renderFile);

  app.set('views', __dirname + '/views');

  if (options.devMode) {
    app.use(devMode());
  }

  app.use(express.static(path.resolve(__dirname, '..', 'dist')));
  app.use(express.static(path.resolve(__dirname, '..', 'assets')));

  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'manifest.json'));
  });

  app.get('/readme', (req,res) => {
    res.redirect(`https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`);
  });

  app.get('/apiKey', (req, res) => {
    const { organization, secret, ship } = req.query;
    const claims = { organization, secret, ship };
    try {
      const hull = new Hull({ id: ship, organization, secret });
      hull.get(`${ship}/secret`).then((ss) => {
        const apiKey = jwt.encode(claims, options.secret);
        res.json({ apiKey });
      }, (error) => {
        res.status(401);
        res.json({ message: 'Unauthorized' });
      })
    } catch(error) {
      res.status(500);
      res.json({ message: error.message });
    }

  });

  app.get('/admin.html', (req, res) => {
    const { organization, secret, ship } = req.query;
    const claims = { organization, secret, ship };
    try {
      const hull = new Hull({ id: ship, organization, secret });
      hull.get(`${ship}/secret`).then((ss) => {
        const apiKey = jwt.encode(claims, options.secret);
        res.render('admin.html', { apiKey });
      }, (error) => {
        res.render('error.html', { error })
      })
    } catch(error) {
      res.render('error.html', { error })
    }
  });

  app.post('/notify', NotifHandler({
    onSubscribe() {
      console.warn("Hello new subscriber !");
    },
    events: {
      'user_report:update': require('./update-user')
    }
  }));

  const segment = SegmentHandler({
    Hull: options.Hull,
    secret: options.secret,
    events: eventsHandlers,
    measure: options.measure || noop,
    log: options.log || noop,
    onError(err) {
      if (process.env.DEBUG) {
        console.warn("Error handling segment event", err, err && err.stack);
      }
    }
  });

  app.post('/segment', segment);

  app.exit = () => segment.exit();

  return app;
}
