import Hull from 'hull';
import generateShipSecret from './generate-ship-secret';

export default function getHullClient(orgUrl, shipId, secret) {
  secret = "a65d3dea0255dfd601f65ecd0b85b89c";
  return new Hull({
    orgUrl: 'https://'+orgUrl,
    platformId: shipId,
    platformSecret: secret
  });
}
