import _ from 'lodash';
import Analytics from 'analytics-node';

export default function(ship, message){
  try {
    // var analytics = new Analytics(ship.settings.write_key);
    // analytics.track({ event: 'Update Segments', properties });
    return true
  } catch(err) {
  }
}
