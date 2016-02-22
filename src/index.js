/* global require, Hull*/

const segment = require('./segment');
const camelize = require('camelize');
segment();

function start(element, deployment, hull) {
  if (window.analytics) {
    window.analytics.load(deployment.ship.settings.write_key);
    window.analytics.page();
  }

  function identify(me) {
    if (window.analytics) {
      try {
        const anonymousId = hull.config('anonymousId') || hull.config('browserId');
        if (anonymousId) {
          window.analytics.user().anonymousId(anonymousId);
        }
      } catch(err) {}
      if (me) {
        const services = Hull.config('services.analytics') || {};
        const user = { id: me.id, name: me.name, email: me.email, username: me.username };
        const options = {};
        if (services && services.intercom && services.intercom.credentials) {
          options.integrations = { Intercom: { user_hash: services.intercom.credentials.user_hash } };
        }
        window.analytics.identify(user.id, user, options);
      } else {
        if (window.analytics.reset){
          window.analytics.reset();
        }
      }
    }
  }

  function track(payload) {
    if (window.analytics && payload) {
      window.analytics.track(payload.event, payload.params);
    }
  }

  function traits(payload) {
    if (window.analytics && payload) {
      window.analytics.identify(camelize(payload));
    }
  }

  Hull.on('hull.track', track);
  Hull.on('hull.traits', traits);
  Hull.on('hull.user.*', identify);
  identify(hull.currentUser());
}

Hull.onEmbed(start);
