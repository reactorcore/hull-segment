import _ from 'lodash';
import Analytics from 'analytics-node';

const getKey = function getKey(arr, k){
  if(!arr || !arr.length){ return []}
  return _.reduce(arr, function(m, s){
    if(s && s[k]){ m.push(s[k]) }
    return m;
  }, []);
}

export default function(ship={}, messageString){
  try{
    var message = JSON.parse(messageString);
  } catch(e){
    console.log('Error parsing', user)
    throw new Error('Invalid Message', message);
  }
  const { user, segments } = (message||{});

  if(!user || !user.id){ return false; }

  if(!ship || !ship.settings){
    return false;
  }

  var analytics = new Analytics(ship.settings.write_key);

  const traits = {
    ...user,
    segments: getKey(segments, 'name'),
    segment_ids: getKey(segments, 'id')
  }

  try {
    analytics.identify({
      userId: user.id,
      traits: traits
      // , timestamp: user.last_seen_at
    });

    // Is it interesting to also save a "User Updated" event so we can message Zapier? Let's try it
    analytics.track({userId: user.id, event: 'User Updated', properties: traits});
  } catch(e){
    console.log("error while sending to analytics", e)
  }
  return true;
}
