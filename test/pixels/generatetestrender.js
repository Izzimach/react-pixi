//
// code to generate test render images
// run this in phantomjs from the root directory:
// 'node_modules/.bin/phantomjs test/pixels/generatetestrender.js'
//

var webPage = require('webpage');
var fs = require('fs');

phantom.injectJs('node_modules/js-base64/base64.js');

var page = webPage.create();

page.viewportSize = {width:400,height:400};

page.onCallback = function(data) {

  //page.render('argh.png');
  //console.log(data);
  for (var renderindex=0; renderindex < data.length; renderindex++) {
    var filename = 'test/pixels/testrender' + renderindex.toString() + '.png';
    fs.write(filename,data[renderindex], 'wb');
    console.log('Write test render file ' + filename);
  }
  phantom.exit();
}

page.open('test/pixels/generatetestrender.html', function() {

  // render a React component and then get the canvas pixels

  var fixture = page.evaluateAsync(function() {
    var fixture = document.getElementById('test-fixture');

    var renderresults = pixelTests(fixture);
    return fixture;
  });
});

