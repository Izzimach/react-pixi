var test_basic_files =[
  require.resolve('lodash'),
  'node_modules/pixi.js/bin/pixi.js',
  'build/react-pixi.js',
  'vendor/phantomjs-shims.js', // need a shim to work with the ancient version of Webkit used in PhantomJS
  'node_modules/resemblejs/resemble.js',
  'test/createTestFixtureMountPoint.js',
  'test/pixels/pixelTests.js',
  'test/basics/*.js',
  'test/components/*.js',
  {pattern:'test/pixels/*.png',included:false, served:true} // for render tests
];

module.exports = function(config) {
  config.set({
    browsers: ['Firefox'],
    frameworks:['jasmine'],
    files: test_basic_files,
    singleRun:true
  });
};
