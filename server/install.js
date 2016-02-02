import getHullClient from './get-hull-client';
import generateShipSecret from './generate-ship-secret';

export default function(config, req, res){
  const { shipId, shipSecret, orgUrl} = req.query;

  var newSecret = generateShipSecret(shipId, config.globalSecret);

  return getHullClient(orgUrl, shipId, shipSecret)
  .put(shipId + '/secret', { secret: newSecret })
  .then(function(res) {
    res.status(200).end(JSON.stringify({ ok: true }));
  }, function(err) {
    res.status(403).end(JSON.stringify({ status: 403, error: 'Unauthorized' }));
  });
}
