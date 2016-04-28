import { reduce } from 'lodash';
import scoped from '../scope-hull-client';

export default function handleTrack(payload, { hull, ship, measure, log }) {
  const { context, anonymousId, event, properties, userId, originalTimestamp, sentAt, receivedAt } = payload;

  const page = (context || {}).page || {};

  const created_at = originalTimestamp || sentAt || receivedAt;

  const aId = anonymousId || userId;
  let sId = (created_at || new Date().toISOString()).substring(0,10);

  if (aId) {
    sId = [aId, sId].join('-');
  }

  const track = reduce({
    ip: context.ip || '0',
    _bid: aId,
    _sid: sId,
    event: event,
    source: 'segment',
    properties: properties || {},
    url: page.url,
    useragent: context.userAgent,
    referrer: page.referrer,
    created_at: created_at
  }, (p, v, k) => {
    if (v !== undefined) {
      p[k] = v;
    }
    return p;
  }, {});


  const tracking = scoped(hull, payload).post('t', track);

  tracking.then(
    ok => {
      log('track.success', track);
    },
    error => {
      measure('request.track.error');
      log('track.error', { error });
    }
  );

  return tracking;
}
