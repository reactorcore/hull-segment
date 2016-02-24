import express from 'express';
import path from 'path';
import { NotifHandler } from 'hull';
import devMode from './dev-mode';
import SegmentHandler from './handler';
import _ from 'lodash';

const TOP_LEVEL_FIELDS = [
  'name',
  'username',
  'first_name',
  'last_name',
  'email',
  'contact_email',
  'image',
  'picture',
  'phone',
  'address',
  'created_at'
];


const ALIASED_FIELDS = {
  lastname: 'last_name',
  firstname: 'first_name',
  createdat: 'created_at'
};

const IGNORED_TRAITS = [
  'id',
  'uniqToken',
  'visitToken'
];

const notifHandler = NotifHandler({
  onSubscribe: function() {
    console.warn("Hello new subscriber !");
  },
  events: {
    'user_report:update': require('./update-user')
  }
});

function updateTraits(hull, userId, traits) {
  return hull.as(userId).traits(traits);
}

function updateUser(hull, user, asUser) {
  return hull.as(asUser).put('me', user.properties).then((hullUser) => {
    return updateTraits(hull, hullUser.id, user.traits);
  }, (err)=> {
    if (/[a-z0-9]{24}/i.test(asUser.external_id)) {
      return updateUser(hull, user, asUser.external_id);
    } else {
      throw err;
    }
  })
}

const segmentHandler = SegmentHandler({

  sharedSecret: process.env.SECRET,

  onError: function(err) {
    console.warn("Boom error", err, err.stack);
  },

  events: {

    page(evt) {
      // console.warn('Boom, page !', evt)
    },

    alias(evt, { ship, hull }) {
      // console.warn('Boom, alias !', evt)
    },

    track(track, { ship, hull }) {
      const { integrations, context, anonymousId, event, properties, userId, originalTimestamp, messageId } = track;
      const page = (context || {}).page || {};

      // Do not resend data to Hull
      if (integrations && integrations.Hull === false) {
        return false;
      }

      const aId = anonymousId || userId;
      let sId = (originalTimestamp || new Date().toISOString()).substring(0,10);

      if (aId) {
        sId = [aId, sId].join('-');
      }

      if (process.env.DEBUG && !originalTimestamp) {
        console.warn(track);
      }

      const payload = {
        ip: context.ip || '0',
        _bid: aId,
        _sid: sId,
        event: event,
        source: 'segment',
        properties: properties || {},
        url: page.url,
        useragent: context.userAgent,
        referrer: page.referrer,
        created_at: originalTimestamp
      };

      return hull.as({ external_id: userId }).post('t', payload);
    },

    identify({ context, traits, userId }, { ship, hull }) {

      const integrations = (context || {}).integrations || {};

      // Do not resend data to Hull
      if (integrations.Hull === false) {
        return false;
      }

      const user = _.reduce((traits || {}), (u, v, k) => {
        if (v == null) return u;
        if (_.include(TOP_LEVEL_FIELDS, k)) {
          u.properties[k] = v;
        } else if (ALIASED_FIELDS[k.toLowerCase()]) {
          u.properties[ALIASED_FIELDS[k.toLowerCase()]] = v;
        } else if (!_.include(IGNORED_TRAITS, k)) {
          u.traits[k] = v;
        }
        return u;
      }, { properties: {}, traits: {} });

      if (userId) {
        return updateUser(hull, user, { external_id: userId });
      }
    }
  }
});

export default function(port) {

  const app = express();

  if (process.env.NODE_ENV !== 'production') {
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

  app.post('/notify', notifHandler);
  app.post('/segment', segmentHandler);

  app.listen(port)

  return app;

}
