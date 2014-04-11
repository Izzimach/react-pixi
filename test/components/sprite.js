describe("PIXI Sprite Component", function() {

  var React = require('react');
  React.PIXI = require('react-pixi');

  var fixture = window.document.createElement('div');
  fixture.id = 'test-fixture';
  window.document.body.appendChild(fixture);

  fixture.parentNode.removeChild(fixture);
});