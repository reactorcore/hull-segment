import { reduce } from 'lodash';

export default function handleTrack(track, { hull, ship }) {
  const { context, anonymousId, event, properties, userId, originalTimestamp, sentAt, receivedAt } = track;
  const page = (context || {}).page || {};


  const created_at = originalTimestamp || sentAt || receivedAt;

  console.warn('raw track', track)

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
  return client.post('t', payload);
}
