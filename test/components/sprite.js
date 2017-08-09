// since Sprite is a subclass of DisplayObjectContainer most
// of the functionality will have been checked by previous tests
// the main thing to test here is that pixels get put on the screen

describe("PIXI Sprite Component", function() {

  // need to prepend 'base' to the path since that's how the karma webserver
  // routes static file serving
  var imagePath = 'base/test/pixels/';
  var pixelReferenceImage = function(index) {
    return [imagePath, 'testrender',index,'.png'].join('');
  };

  var mountpoint = null;

  beforeEach(function() { mountpoint = createTestFixtureMountPoint(); });
  afterEach(function() { removeTestFixtureMountPoint(mountpoint); });

  
  it("puts pixels on the canvas", function(done) {
    pixelTests(mountpoint, imagePath, function (results) {
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      var comparesperformed = 0;
      for (var compareindex=0; compareindex < results.length; compareindex++) {
        var refimageURI = pixelReferenceImage(compareindex);
        var testimageURI = results[compareindex];

        resemble(testimageURI)
          .compareTo(refimageURI)
          .onComplete(function (data) {
            expect(data).toBeDefined();
            expect(typeof data).toEqual('object');
            expect(data.isSameDimensions).toEqual(true);
            if (data.misMatchPercentage > 0.2) {
              console.log("mismatch is " + data.misMatchPercentage.toString());
              console.log("reference image URI is " + refimageURI);
              console.log("test image URI is " + testimageURI);
              console.log("mismatch image data URI is " + data.getImageDataUrl());
            }
            console.log("image compare result is " + data.toString());
            expect(data.misMatchPercentage).toBeLessThan(0.2);

            comparesperformed++;
            if (comparesperformed === results.length) {
              done();
            }
          });
      }

    });
  });

  var Stage = React.createFactory(ReactPIXI.Stage);
  var Sprite = React.createFactory(ReactPIXI.Sprite);

  var SpriteTestComponent = React.createClass({
    displayName: 'ExampleSpriteComponent',
    render: function () {
      return Stage({width: 800, height: 600, ref: 'stage'},
        Sprite(this.props));
     }
  });

  var SpriteTest = React.createFactory(SpriteTestComponent);

  it('The anchor property can be updated by position prop in all the various forms', (done) => {
    var setAndExpect = [
      {set: [-1], expect: new PIXI.Point(-1, -1)},
      {set: [0.5, 1], expect: new PIXI.Point(0.5, 1)},
      {set: "0.25", expect: new PIXI.Point(0.25, 0.25)},
      {set: "1,1", expect: new PIXI.Point(1, 1)},
      {set: new PIXI.Point(1, 0.5), expect: new PIXI.Point(1, 0.5)},
      {set: new PIXI.Point(-0.5), expect: new PIXI.Point(-0.5, 0)},
      {set: new PIXI.ObservablePoint(() => {}, {}, 0.5, -1), expect: new PIXI.Point(0.5, -1)}
    ];

    setAndExpect.forEach( (data) => {
      var reactInstance = ReactPIXI.render(
        SpriteTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          anchor: data.set,
          texture: PIXI.Texture.EMPTY
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var sprite = stage.children[0];
      expect(sprite.anchor.x).toBe(data.expect.x);
      expect(sprite.anchor.y).toBe(data.expect.y);
    });

    done();
  });

  it('The anhor property can be updated by position prop in all the various forms', (done) => {
    var setAndExpect = [
      {set: [-1], expect: new PIXI.Point(-1, -1)},
      {set: [0.5, 1], expect: new PIXI.Point(0.5, 1)},
      {set: "0.25", expect: new PIXI.Point(0.25, 0.25)},
      {set: "1,1", expect: new PIXI.Point(1, 1)},
      {set: new PIXI.Point(1, 0.5), expect: new PIXI.Point(1, 0.5)},
      {set: new PIXI.Point(-0.5), expect: new PIXI.Point(-0.5, 0)},
      {set: new PIXI.ObservablePoint(() => {}, {}, 0.5, -1), expect: new PIXI.Point(0.5, -1)}
    ];

    setAndExpect.forEach( (data) => {
      var reactInstance = ReactPIXI.render(
        SpriteTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          skew: data.set,
          texture: PIXI.Texture.EMPTY
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var sprite = stage.children[0];
      expect(sprite.skew.x).toBe(data.expect.x);
      expect(sprite.skew.y).toBe(data.expect.y);
    });

    done();
  });
});
