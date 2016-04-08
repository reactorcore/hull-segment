export default function handleTrack(track, { hull, ship }) {
  const { context, anonymousId, event, properties, userId, originalTimestamp } = track;
  const page = (context || {}).page || {};

  const aId = anonymousId || userId;
  let sId = (originalTimestamp || new Date().toISOString()).substring(0,10);

  if (aId) {
    sId = [aId, sId].join('-');
  }

  const payload = {
    ip: context.ip || '0',
    _bid: aId,
    _sid: sId,
    event: event,
    source: 'segment',
    properties: properties || {},
    url: page.url,
    useragent: context.userAgent,
    referrer: page.referrer,
    created_at: originalTimestamp
  };

  const client = userId ? hull.as({ external_id: userId }) : hull;

  return client.post('t', payload);
}
