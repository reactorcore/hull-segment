import _ from 'lodash';

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

export default function(Analytics) {

  return function({ message }, { ship }) {
    const { user={}, segments=[], events=[] } = message;

    if(!ship || !user || !user.id || !user.external_id) {
      return false;
    }

    // Custom properties to be synchronized
    const {
      synchronized_properties=[],
      synchronized_segments=[],
      forward_events
    } = ship.private_settings || {};
    const segment_ids = _.map(segments, 'id');

    if (
      synchronized_segments.length > 0 &&
      !_.intersection(segment_ids, synchronized_segments).length
      ){
      console.log(`Skip update for ${user.id} because not matching any segment`);
      return false;;
    };

    const userId = user['external_id'];
    const groupId = user['traits_group/id'];

    // Configure Analytics.js with write key
    // Ignore if write_key is not present
    const { write_key, handle_groups } = ship.settings || {};
    if (!write_key) {
      console.warn('No write_key for ship', ship.id);
      return Promise.reject(new Error("Missing credentials"));
    }
    const analytics = new Analytics(write_key);

    // Build traits that will be sent to Segment
    // Use hull_segments by default

    const traits = {
      hull_segments: _.map(segments, 'name')
    };


    if(synchronized_properties.length > 0) {
      synchronized_properties.map((prop) => {
        traits[prop.replace(/^traits_/,'').replace('/','_')] = user[prop];
      });
    }

    const context = {
      active: false,
      ip: 0,
      integrations: {
        Hull: false
      }
    }

    // Add group if available
    if (handle_groups && groupId) {
      context.groupId = groupId;
    }

    console.warn(`[${ship.id}] segment.send.identify`, JSON.stringify({ userId, traits, context }));
    const ret = analytics.identify({ userId, traits, context });

    if (forward_events && events && events.length > 0) {
      events.map(e => {
        const { page={}, referrer={}, os={}, useragent, ip = 0 } = e.context || {};
        const track = {
          userId,
          anonymousId: e.anonymous_id,
          event: e.event,
          properties: e.properties,
          timestamp: new Date(e.created_at),
          context: {
            active: true,
            integrations: { Hull: false },
            ip: ip,
            userAgent: useragent,
            page: {
              url: page.url
            },
            referrer: {
              url: referrer.url
            },
            os: os
          }
        };
        console.warn(`[${ship.id}] segment.send.track`, JSON.stringify(track));
        analytics.track(track);
      })
    }

    return ret;
  }
}
