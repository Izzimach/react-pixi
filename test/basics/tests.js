
describe("React and React.PIXI modules", function() {

  // make sure we're running jasmine 2.0 by using the new
  // versions of the async functions
  it("are tested using Jasmine 2.0", function(done) {
    done();
  });

  it("exist and are loaded", function() {
    expect(React).toBeDefined();
    expect(ReactPIXI).toBeDefined();
  });

  it("has all the components you expect", function() {
    expect(React.DOM).toBeDefined();
    expect(ReactPIXI.Stage).toBeDefined();
    expect(ReactPIXI.DisplayObjectContainer).toBeDefined();
    expect(ReactPIXI.Text).toBeDefined();
    expect(ReactPIXI.Sprite).toBeDefined();
    expect(ReactPIXI.BitmapText).toBeDefined();
    expect(ReactPIXI.TilingSprite).toBeDefined();
  });
});
