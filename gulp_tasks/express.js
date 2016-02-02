var gutil = require('gulp-util');
var start = require('../server/start');

module.exports = function(gulp, config={}){
  gulp.task('express', function(callback) {
    start(config.backendPort);
    callback();
  });
}
