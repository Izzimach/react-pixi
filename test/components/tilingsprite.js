// Test the features unique to the TilingSprite

describe("PIXI TilingSprite Component", () => {
  const testImagePath = 'base/test/pixels/testsprite.png';
  const width = 300;
  const height = 300;

  var Stage = React.createFactory(ReactPIXI.Stage);
  var TilingSprite = React.createFactory(ReactPIXI.TilingSprite);

  var TilingSpriteTestComponent = createReactClass({
    displayName: 'ExampleTilingSpriteComponent',
    render: function () {
      return Stage({width: width, height: height, ref: 'stage'},
        TilingSprite(this.props.tilingSpriteProps));
     }
  });

  var TilingSpriteTest = React.createFactory(TilingSpriteTestComponent);

  it('The tilePosition and tileScale properties can be updated in all the various forms', (done) => {
    var setAndExpect = [
      {set: [-420], expect: new PIXI.Point(-420, -420)},
      {set: [169, 532], expect: new PIXI.Point(169, 532)},
      {set: "4", expect: new PIXI.Point(4, 4)},
      {set: "42,68", expect: new PIXI.Point(42, 68)},
      {set: new PIXI.Point(123, 456), expect: new PIXI.Point(123, 456)},
      {set: new PIXI.Point(123), expect: new PIXI.Point(123, 0)},
      {set: new PIXI.ObservablePoint(() => {}, {}, 654, 321), expect: new PIXI.Point(654, 321)}
    ];

    var mountpoint = createTestFixtureMountPoint();
    setAndExpect.forEach( (data) => {
      var reactInstance = ReactPIXI.render(
        TilingSpriteTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          tilingSpriteProps: {
            image: testImagePath, width: width, height: height, 
            tilePosition: data.set,
            tileScale: data.set
          }
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var tilingSprite = stage.children[0];
      expect(tilingSprite.tilePosition.x).toBe(data.expect.x);
      expect(tilingSprite.tilePosition.y).toBe(data.expect.y);
      expect(tilingSprite.tileScale.x).toBe(data.expect.x);
      expect(tilingSprite.tileScale.y).toBe(data.expect.y);
    });

    done();
  });
});
