var gutil = require('gulp-util');

module.exports = function(gulp, c){
  // Launch Dashboard Server + Proxy. Inject Dev Middleware.
  gulp.task('express', function(callback) {
    var argv = require('minimist')(process.argv);
    var server = require('../server/index');
    var config = require('../server/config').config(process.env, argv);
    server.start(config, process.env.PORT || c.backendPort);
    callback()
  });
}
