/* global require, Hull*/

const segment = require('./segment');
segment();

// function getProperty(obj, propertyName) {
//   for (let i = 0; i < obj.identities.length; i++) {
//     if (obj.identities[i][propertyName]) {
//       return obj.identities[i][propertyName];
//     }
//   }
// }

function start(element, deployment, hull) {
  if (window.analytics) {
    window.analytics.load(deployment.ship.settings.project_id);
    window.analytics.page();
  }

  function identify(me) {
    if (me && window.analytics) {
      debugger;
      const services = Hull.config().services.analytics || {};
      const user = { id: me.id, name: me.name, email: me.email, username: me.username};
      const options = {};
      if (services && services.intercom) {
        options.integrations = { Intercom: { user_hash: services.intercom.user_hash } };
      }
      window.analytics.identify(user.id, user, options);
    }
  }
  // const email = me.email || getProperty(me, 'email');
  // const name = me.name || me.username || getProperty(me, 'name') || getProperty(me, 'username') || email;

  function track(payload) {
    if (window.analytics) {
      window.analytics.track(payload.event, payload.params);
    }
  }

  Hull.on('hull.track', track);
  Hull.on('hull.user.*', identify);
  identify(hull.currentUser());
}

Hull.onEmbed(start);
