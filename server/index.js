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
  return hull.as(userId, false).traits(traits);
}

function updateUser(hull, user) {

  try {
    const { userId, anonymousId, properties, traits } = user;
    let client = hull;

    if (userId) {
      let hullAs = { external_id: userId };
      if (anonymousId) {
        hullAs.guest_id = anonymousId;
      }
      client = hull.as(hullAs);
    } else if (anonymousId) {
      properties._bid = anonymousId;
    }

    return client.put('me', properties).then((hullUser) => {
      return updateTraits(hull, hullUser.id, traits);
    }, (err) => {
      console.warn('Error ', err, err.stack);
    });
  } catch (err) {
    console.warn('Error on updateUser', err, err.stack);
  }

}

const segmentHandler = SegmentHandler({

  sharedSecret: process.env.SECRET,

  onError: function(err) {
    console.warn("Boom error", err, err.stack);
  },

  events: {

    page(evt) {},

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

      const client = userId ? hull.as({ external_id: userId }) : hull;

      return client.post('t', payload);
    },

    identify(payload, { ship, hull }) {
      const { context, traits, userId, anonymousId } = payload;

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
      }, { userId, anonymousId, properties: {}, traits: {} });

      if (!_.isEmpty(user.traits) || !_.isEmpty(user.properties)) {
        return updateUser(hull, user);
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
