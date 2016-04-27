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
  const { user={}, segments } = message;
  const { group={} } = user;

  if(!user.external_id){ return false; }

  let customGroup={};

  if((ship.private_settings||{}).synchronized_properties){
    customGroup = ship.private_settings.synchronized_properties.reduce((memo, prop)=>{
      memo[prop.replace(/^traits_/,'').replace('/','_')] = user[prop];
      return memo;
    }, {});
  }

  if (!user || !user.id) {
    return false;
  }

  if (!ship || !ship.settings || !ship.settings.write_key) {
    console.warn('No write_key for ship', (ship || {}).id);
    return Promise.reject(new Error("Missing credentials"));
  }

  var analytics = new Analytics(ship.settings.write_key);

  const traits = {
    hull_segments: getKey(segments, 'name').join(","),
    ...customGroup
  };

  const context = {
    active: false,
    ip: 0,
    integrations: {
      Hull: false
    }
  }

  if(group.id){
    context.groupId = group.id;
  }

  const userId = user.external_id || user.id;

  analytics.identify({ userId, traits, context });
}
