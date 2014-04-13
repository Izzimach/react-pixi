// since Sprite is a subclass of DisplayObjectContainer most
// of the functionality will have been checked by previous tests
// the main thing to test here is that pixels get put on the screen

describe("PIXI Sprite Component", function() {

  var React = require('react');
  React.PIXI = require('react-pixi');

  var fixture = window.document.createElement('div');
  fixture.id = 'test-fixture';
  window.document.body.appendChild(fixture);

  fixture.parentNode.removeChild(fixture);
});
