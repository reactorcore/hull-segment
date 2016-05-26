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

  return function({ message={} }, { ship={} }) {
    const { user={}, segments=[], events=[] } = message;

    // Empty payload ?
    if (!user.id || !ship.id) {
      return false;
    }

    // Configure Analytics.js with write key
    // Ignore if write_key is not present
    const { write_key, handle_groups, public_id_field } = ship.settings || {};
    if (!write_key) {
      console.warn('No write_key for ship', ship.id);
      return false;
    }

    const analytics = new Analytics(write_key);

    // Look for an anonymousId
    // if we have events in the payload, we take the annymousId of the first event
    // Otherwise, we look for known anonymousIds attached to the user and we take the last one
    let anonymousId;
    if (events && events.length > 0 && events[0].anonymous_id) {
      anonymousId = events[0].anonymous_id;
    } else if (user.anonymous_ids && user.anonymous_ids.length) {
      anonymousId = _.first(user.anonymous_ids);
    }

    const publicIdField = public_id_field === 'id' ? 'id' : 'external_id';

    const userId = user[publicIdField];
    const groupId = user['traits_group/id'];

    // We have no identifier for the user, we have to skip
    if (!userId && !anonymousId) {
      console.warn(`[${ship.id}] skip.user - no identifier`);
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

    const integrations = {
      Hull: false
    };

    const context = {
      active: false,
      ip: 0,
    };

    // Add group if available
    if (handle_groups && groupId && userId) {
      context.groupId = groupId;
      const groupTraits = _.reduce(user, (group, value, key) => {
        const mk = key.match(/^traits_group\/(.*)/);
        const groupKey = mk && mk[1];
        if (groupKey && groupKey !== 'id') {
          group[groupKey] = value;
        }
        return group;
      }, {});
      if (!_.isEmpty(groupTraits)) {
        console.warn(`[${ship.id}] segment.send.group`, JSON.stringify({ groupId, userId, traits: groupTraits, context }));
        analytics.group({ groupId, anonymousId, userId, traits: groupTraits, context, integrations });
      }
    }

    console.warn(`[${ship.id}] segment.send.identify`, JSON.stringify({ userId, traits, context }));
    const ret = analytics.identify({ anonymousId, userId, traits, context, integrations });

    if (forward_events && events && events.length > 0) {
      events.map(e => {
        const { page={}, referrer={}, os={}, useragent, ip = 0 } = e.context || {};
        const track = {
          userId,
          anonymousId: e.anonymous_id,
          event: e.event,
          properties: e.properties,
          timestamp: new Date(e.created_at),
          integrations,
          context: {
            groupId,
            active: true,
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
