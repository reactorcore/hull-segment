import { reduce } from 'lodash';

export default function handleTrack(track, { hull, ship, measure, log }) {
  const { context, anonymousId, event, properties, userId, originalTimestamp, sentAt, receivedAt } = track;
  const page = (context || {}).page || {};


  const created_at = originalTimestamp || sentAt || receivedAt;

  const aId = anonymousId || userId;
  let sId = (created_at || new Date().toISOString()).substring(0,10);

  if (aId) {
    sId = [aId, sId].join('-');
  }

  const payload = reduce({
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

  const client = userId ? hull.as({ external_id: userId }) : hull;

  const tracking = client.post('t', payload);

  tracking.then(
    ok => {
      log('track.success', payload);
    },
    error => {
      measure('request.track.error');
      log('track.error', { error });
    }
  );

  return tracking;
}
