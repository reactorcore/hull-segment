import _ from 'lodash';
import Analytics from 'analytics-node';


function camelize(str) {
  return str.replace (/(?:^|[-_])(\w)/g, function (_, c, i) {
    var s = i == 0 ? c : c.toUpperCase();
    return c ? s : '';
  });
};

const TOP_LEVEL_FIELDS = [
  'name',
  'username',
  'first_name',
  'last_name',
  'phone',
  'description'
];

const ADDRESS_FIELDS = [
  'street',
  'city',
  'postal_code',
  'state',
  'country'
];

const getKey = function getKey(arr, k){
  if(!arr || !arr.length){ return []}
  return _.reduce(arr, function(m, s){
    if(s && s[k]){ m.push(s[k]) }
    return m;
  }, []);
}

export default function({ message }, { ship }){
  const { user, segments } = message;

  if (!user || !user.id) {
    return false;
  }

  if (!ship || !ship.settings || !ship.settings.write_key) {
    console.warn('Missing credentials for ship', (ship || {}).id);
    return Promise.reject(new Error("Missing credentials"));
  }

  var analytics = new Analytics(ship.settings.write_key);

  const traits = _.reduce(user, (t, v, k) => {
    if (_.include(TOP_LEVEL_FIELDS, k)) {
      t[camelize(k)] = v;
    } else if (/^traits_/.test(k) && !/^traits_group__/.test(k)) {
      t[k.replace(/^traits_/, '')] = v;
    } else if (/^address_/.test(k) && v && v.length > 0) {
      t.address = t.address || {};
      t.address[camelize(k.replace(/^address_/, ''))] = v;
    }
    return t;
  }, {});

  if (user.contact_email && user.contact_email.length > 4) {
    traits.email = user.contact_email;
  }

  traits.hull_segments = getKey(segments, 'name').join(",");

  const context = {
    active: false,
    ip: 0,
    integrations: {
      Hull: false
    }
  }

  const userId = user.external_id || user.id;

  analytics.identify({
    userId: userId,
    traits, context
  });
}
