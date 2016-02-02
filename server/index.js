// TODO : need to have a live reloading server - pain to reload every time we do a change.
import express from 'express';
import path from 'path';
import _ from 'lodash';
import bootstrap from './bootstrap';
import webpackMiddleware from 'webpack-dev-middleware';
import webpack from 'webpack';
import webpackConfig from '../webpack.config.js';

var bodyParser = require('body-parser');

const PROCESSORS = {
  'user_report': require('./update-user'),
  'users_segment':require('./update-segment')
}


function devMode() {
  const compiler = webpack(webpackConfig);
  return webpackMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });
}


export default {
  start: function(config, port) {

    let app = express();

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    const bus = bootstrap(app, config);

    _.map(PROCESSORS, function(value, key){
      bus.on(key, value);
    })

    if (process.env.NODE_ENV !== 'production') {
      app.use(devMode());
    }

    app.use(express.static(path.resolve(__dirname, '..', 'dist')));
    app.use(express.static(path.resolve(__dirname, '..', 'assets')));

    app.get('/manifest.json', (req, res, next) => {
      res.sendFile(path.resolve(__dirname, '..', 'manifest.json'));
    });

    app.listen(port)

    return app;
  }
}
