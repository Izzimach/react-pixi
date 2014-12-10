//
// Basic ReactPIXI example using pixi events to add/remove sprites.
// Note that in order for a sprite to be clickable the sprite has
// to be interactive (sprite.interactive = true)
//
// For react-pixi this means you should have 'interactive:true' in your props
//

// tell jshint that we use lodash
/* global _ : false */
/* global React : false */
/* global ReactPIXI : false */
/* global pixelTests : false */
/* jshint strict: false */

// the mounted instance will go here, so that callbacks can modify/set it
var g_reactinstance;

// This basically the 'application state':
var g_applicationstate = {};

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - sprites: a list of objects describing all the current sprites containing x,y and image fields
//

var PixelRefs = React.createClass({
  displayName: 'PixelRefs',
  render: function() {
    var testimageelements = _.map(this.props.testimageURLs, function(imageURL) {
      return React.DOM.img({src:imageURL, key:imageURL});
    });
    return React.DOM.div(
      {},
      testimageelements
    );
  }
});
var PixelRefsFactory = React.createFactory(PixelRefs);

/* jshint unused:false */
function viewpixeltestsstart() {

  var testfixture = document.getElementById("test-fixture");
  var renderelement = document.getElementById("show-pixels");
  var imagePath = '../../test/pixels/';

  var pixelTestResults = {};
  pixelTests(testfixture, imagePath, function (results) {
    g_applicationstate = {testimageURLs:results};
    React.render(PixelRefsFactory(g_applicationstate), testfixture);
  });
}
