import _ from 'lodash';
import Analytics from 'analytics-node';

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

  const traits = {
    ...user,
    segments: getKey(segments, 'name'),
    segment_ids: getKey(segments, 'id')
  }

  analytics.identify({
    userId: user.id,
    traits: traits
  });

  // Is it interesting to also save a "User Updated" event so we can message Zapier? Let's try it
  analytics.track({
    event: 'User Updated',
    userId: user.id,
    properties: traits
  });

}
