import express from 'express';
import path from 'path';
import { NotifHandler } from 'hull';
import devMode from './dev-mode';
import SegmentHandler from './handler';
import eventsHandlers from './events'

export default function(options) {

  const app = express();

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

  app.post('/notify', NotifHandler({
    onSubscribe() {
      console.warn("Hello new subscriber !");
    },
    events: {
      'user_report:update': require('./update-user')
    }
  }));

  app.post('/segment', SegmentHandler({
    secret: options.secret,
    events: eventsHandlers,
    onError(err) {
      console.warn("Error handling segment event", err, err.stack);
    }
  }));

  return app;
}
