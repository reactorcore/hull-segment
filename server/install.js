import getHullClient from './get-hull-client';
import generateShipSecret from './generate-ship-secret';

export default function(config) {
  return function(req, res) {
    const { id, secret, org } = req.query;
    return getHullClient(org, id, secret)
      .put(id + '/secret', { secret: generateShipSecret(id, config.globalSecret) })
      .then(function(e) {
        res.status(200).end(JSON.stringify({ ok: true }));
      }, function(err) {
        res.status(403).end(JSON.stringify({ status: 403, error: 'Unauthorized' }));
      });
  }
}
