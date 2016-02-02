export default function start(port=process.env.PORT){
  var argv = require('minimist')(process.argv);
  var server = require('./index');
  var config = require('./config').config(process.env, argv);
  server.start(config, port);
}
