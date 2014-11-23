//
// system-level requires
//

var exec = require('child_process').exec;
var path = require('path');

//
// gulp-specific tools
//

var gulp = require('gulp');
var concat = require('gulp-concat');
var vsource = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var jshint = require('gulp-jshint');
var livereload = require('gulp-livereload');
var gutil = require('gulp-util');
var header = require('gulp-header');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

//
// testing/packaging
//

var karma = require('karma');
var browserify = require('browserify');
var pkg = require('./package.json');

//
// config for the web server used to serve examples
//

var SERVERPORT = 8080;
var SOURCEGLOB = './src/**/*.js';
var EXAMPLESGLOB = './examples/**/*.js';

//
// final built output goes into build/<OUTPUTFILE>.js
//

var OUTPUTFILE = 'react-pixi';

var banner = ['/**',
              ' * <%= pkg.name %>',
              ' * @version <%= pkg.version %>',
              ' * @license <%= pkg.license %>',
              ' */',
              ''].join('\n');

var browserlist = ['Firefox'];
var karmaconfiguration = {
    browsers: browserlist,
    files: ['bower_components/lodash/dist/lodash.min.js',
            'bower_components/pixi.js/bin/pixi.dev.js',
            'build/react-pixi.js',
            'vendor/phantomjs-shims.js', // need a shim to work with the ancient version of Webkit used in PhantomJS
            'node_modules/resemblejs/resemble.js',
            'test/createTestFixtureMountPoint.js',
            'test/pixels/pixelTests.js',
            'test/basics/*.js',
            'test/components/*.js',
            {pattern:'test/pixels/*.png',included:false, served:true} // for render tests
           ],
    frameworks:['jasmine'],
    singleRun:true
};

function errorHandler(err) {
  gutil.log(err);
  this.emit('end'); // so that gulp knows the task is done
}

gulp.task('help', function() {
  console.log('Possible tasks:');
  console.log('"default" - compile react-pixi into build/react-pixi.js');
  console.log('"dist" - compile react-pixi into dist/ directory for distribution');
  console.log('"watch" - watch react-pixi source files and rebuild');
  console.log('"test" - run tests in test directory');
  console.log('"livereload" - compile and launch web server/reload server');
  console.log('"pixelrefs" - generate reference images for render-specific tests');
});

gulp.task('lint', function() {
  return gulp.src([SOURCEGLOB,EXAMPLESGLOB])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('browserify',['lint'], function() {
  var bundler = browserify();
  bundler.require('react');
  bundler.require('./src/ReactPIXI.js',{expose:'react-pixi'});

  return bundler.bundle().on('error', errorHandler)
    .pipe(vsource('react-pixi-commonjs.js'))
    .pipe(gulp.dest('build'));
});

gulp.task('bundle', ['browserify'], function() {

  // If we're running a gulp.watch and browserify finds and error, it will
  // throw an exception and terminate gulp unless we catch the error event.
  return gulp.src(['build/react-pixi-commonjs.js','src/react-pixi-exposeglobals.js'])
    .pipe(concat('react-pixi.js'))
    .pipe(streamify(replace("process.env.NODE_ENV", "\"development\"")))
    .pipe(gulp.dest('build'));
});

gulp.task('bundle-min', ['browserify'], function() {
  return gulp.src(['build/react-pixi-commonjs.js','src/react-pixi-exposeglobals.js'])
    .pipe(concat('react-pixi.min.js'))
    .pipe(streamify(replace("process.env.NODE_ENV", "\"production\"")))
    .pipe(streamify(uglify({preserveComments:'some'})))
    .pipe(gulp.dest('build'));
});

gulp.task('watch', ['bundle', 'bundle-min'], function() {
  gulp.watch(SOURCEGLOB, ['browserify']);
});

gulp.task('livereload', ['lint','bundle'], function() {
  var nodestatic = require('node-static');
  var fileserver = new nodestatic.Server('.');
  require('http').createServer(function(request, response) {
    request.addListener('end', function() {
      fileserver.serve(request,response);
    }).resume();
  }).listen(SERVERPORT);

  var livereloadserver = livereload();

  gulp.watch([SOURCEGLOB], ['bundle','bundle-min']);
  gulp.watch(['build/**/*.js', 'examples/**/*.js','examples/**/*.html'], function(file) {
    livereloadserver.changed(file.path);
  });
});

gulp.task('test', ['bundle', 'bundle-min'], function() {
  karma.server.start(karmaconfiguration, function (exitCode) {
    gutil.log('Karma has exited with code ' + exitCode);
    process.exit(exitCode);
  });
});

// dist put build results into dist/ for release via bower
gulp.task('dist', ['bundle', 'bundle-min', 'test'], function() {
  return gulp.src(['build/**'], {base:'build'})
    .pipe(gulp.dest('dist'));
});


//
// generate the bitmap references used in testing
//

gulp.task('pixelrefs', function() {
  var command = path.normalize('./node_modules/.bin/phantomjs');
  var child = exec(command + ' test/pixels/generatetestrender.js',
                  function(error, stdout, stderr) {
                    gutil.log('result of reference image generation:\n' + stdout);
                    if (stderr.length > 0) {
                      gutil.log('stderr: ' + stderr);
                    }
                    if (error !== null) {
                      gutil.log('exec error: ' + error);
                    }
                  });
});

gulp.task('default', ['lint','bundle', 'bundle-min']);
