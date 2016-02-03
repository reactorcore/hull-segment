const CACHE = {};

import getHullClient from './get-hull-client';
import generateShipSecret from './generate-ship-secret';

function cache(id, client){
  if(id && !client){ return CACHE[id]; }
  CACHE[id]=client;
  return client;
}

export default function getCachedShip(id, organization, secret){
  return new Promise(function(resolve, reject){
    const ship = cache(id);
    if(ship) { return resolve(ship); }
    getHullClient(organization, id, secret)
    .get(id).then( (ship)=> {
      resolve(cache(id, ship));
    }, (err) => {
      reject(err);
    });
  });
}
