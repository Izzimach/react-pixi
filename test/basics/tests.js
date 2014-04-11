
describe("React and React.PIXI modules", function() {
  var React = require('react');
  React.PIXI = require('react-pixi');

  it("exist and are loaded", function() {
    expect(React).toBeDefined();
    expect(React.PIXI).toBeDefined();
  });

  it("has all the components you expect", function() {
    expect(React.DOM).toBeDefined();
    expect(React.PIXI.Sprite).toBeDefined();
  });
});

