
describe("React and React.PIXI modules", function() {
  var React = require('react');
  React.PIXI = require('react-pixi');


  // make sure we're running jasmine 2.0 by using the new
  // versions of the async functions
  it("are tested using Jasmine 2.0", function(done) {
    done();
  });

  it("exist and are loaded", function() {
    expect(React).toBeDefined();
    expect(React.PIXI).toBeDefined();
  });

  it("has all the components you expect", function() {
    expect(React.DOM).toBeDefined();
    expect(React.PIXI.Stage).toBeDefined();
    expect(React.PIXI.DisplayObjectContainer).toBeDefined();
    expect(React.PIXI.Text).toBeDefined();
    expect(React.PIXI.BitmapText).toBeDefined();
    expect(React.PIXI.TilingSprite).toBeDefined();
  });
});

