import _ from 'lodash';
import Analytics from 'analytics-node';

export default function(config={}, properties){
  var analytics = new Analytics(config.ship.settings.write_key);
  console.log("update segment", properties);
  // analytics.track({event: 'Update Segments', properties});
  return true
}
