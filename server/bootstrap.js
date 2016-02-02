import path from 'path';
import SNSClient from 'aws-snsclient';
import install from './install';
import getCachedShip from './get-cached-ship';

import EventEmitter from 'events';
class Bus extends EventEmitter {}

function name(payload={}){
  return (payload.Subject||"").split(':')[0];
}
function message(payload={}){
  return payload.Message || {}
}


export default function bootstrap(app, config, processors){
  app.get('/install', install(config));

  const bus = new Bus();

  function process(ship, err=null, payload){
    if (err) { console.warn('Error while processing payload: ', err); }
    if (!payload||!ship) { return false; }
    bus.emit(name(payload), ship, message(payload));
  }

  function showReadme(req,res){
    res.redirect(`https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`);
  }

  app.get('/readme', showReadme);

  app.post('/notify', function(req, res){

    var { ship, organization } = req.query;

    if(!ship || !organization){
      console.log('Message lacks Organization and Ship');
      return false;
    }

    getCachedShip(ship, organization, config.globalSecret).then(function(ship){
      SNSClient({ verify: false }, process.bind(null, ship))(req, res);
    });

  });

  app.get('/manifest.json', function(req, res){
    res.sendFile(path.resolve(__dirname, '..', 'manifest.json'));
  });

  return bus;
}
