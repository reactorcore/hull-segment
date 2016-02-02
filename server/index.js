// TODO : need to have a live reloading server - pain to reload every time we do a change.
import express from 'express';
import path from 'path';
import _ from 'lodash';
import bootstrap from './bootstrap';

var bodyParser = require('body-parser');

const PROCESSORS = {
  'user_report': require('./update-user'),
  'users_segment':require('./update-segment')
}

export default {
  start: function(config, port) {
    
    let app = express();

    app.use(express.static(path.resolve(__dirname, '..', 'dist')));
    app.use(express.static(path.resolve(__dirname, '..', 'assets')));

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    const bus = bootstrap(app, config);
    _.map(PROCESSORS, function(value, key){
      bus.on(key, value);
    })

    app.listen(port)

    return app;
  }
}
