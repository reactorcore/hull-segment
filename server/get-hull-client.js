import Hull from 'hull';
import generateShipSecret from './generate-ship-secret';

export default function getHullClient(orgUrl, shipId, secret) {
  return new Hull({
    orgUrl: 'https://'+orgUrl,
    platformId: shipId,
    platformSecret: secret
  });
}
