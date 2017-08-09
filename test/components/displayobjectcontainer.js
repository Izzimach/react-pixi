describe("PIXI DisplayObject Component", function() {
  var DisplayObjectContainer = React.createFactory(ReactPIXI.DisplayObjectContainer);

  var mountpoint = null;

  beforeEach(function() { mountpoint = createTestFixtureMountPoint(); });
  afterEach(function() { removeTestFixtureMountPoint(mountpoint); });

  //
  // This component just renders a DisplayObjectContainer which
  // has some specific number of DisplayObjectContainer objects as children.
  // you specify the number of children as props.childCount
  //
  var VariableChildrenComponent = React.createClass({
    displayName: 'variableChildrenComponent',
    render: function () {
      var docargs = [{key:'argh'}];
      for (var childindex=0; childindex < this.props.childCount; childindex++) {
        var somechild = DisplayObjectContainer(
          {
            key:childindex,
            ref:'child' + childindex.toString(),
            x:childindex
          }
        );
        docargs.push(somechild);
      }

      return DisplayObjectContainer.apply(null, docargs);
    }
  });

  function VariableChildrenTest(numchildren) {
    return createTestFixture({
      width:300,
      height:300,
      subcomponentfactory: React.createFactory(VariableChildrenComponent),
      subcomponentprops:{childCount:numchildren}
    });
  };

  var maxtestchildren = 10;

  it("maintains proper references to the parent DisplayObject", function() {
    var reactinstance = ReactPIXI.render(VariableChildrenTest(1),mountpoint);

    var stage = reactinstance.refs['stage'].getNativeNode();
    var testpoint = stage.children[0];

    expect(testpoint.parent).toBe(stage);
  });

  it("can hold a variable number of children", function() {

    for (var numchildren = 0; numchildren < maxtestchildren; numchildren++) {
      var reactinstance = ReactPIXI.render(
        VariableChildrenTest(numchildren),
        mountpoint);

      expect(mountpoint.childNodes.length).toBe(1);
      expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].getNativeNode();
      var testpoint = stage.children[0];

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);

      // make sure they're in the right order by examing the x-coordinate of
      // each child display object
      for (var testindex=0; testindex < numchildren; testindex++) {
        expect(testpoint.children[testindex].x).toBeCloseTo(testindex,2);
      }
    }
  });

  it ("can add DisplayObjects to an already-mounted tree", function() {
    var reactinstance = ReactPIXI.render(
      VariableChildrenTest(0),
      mountpoint);

    for (var numchildren = 1; numchildren < maxtestchildren; numchildren++) {

      // this should add another DisplayObject as a child
      reactinstance = ReactPIXI.render(
        VariableChildrenTest(numchildren),
        mountpoint);

      expect(mountpoint.childNodes.length).toBe(1);
      expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, not DOM nodes
      expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].getNativeNode();
      var testpoint = stage.children[0];

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);

      // here we don't unmount, so that the next time through React has to
      // add children instead of building them anew.
    }
  });

  it("can remove DisplayObjects from an already-mounted tree", function() {
    var reactinstance = ReactPIXI.render(
      VariableChildrenTest(maxtestchildren),
      mountpoint);

    for (var numchildren = maxtestchildren-1; numchildren > 0; numchildren--) {

      // this should remove an already existing child
      var reactinstance = ReactPIXI.render(
        VariableChildrenTest(numchildren),
        mountpoint);

      expect(mountpoint.childNodes.length).toBe(1);
      expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].getNativeNode();
      var testpoint = stage.children[0];

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);
    }
  });


  it("renders null as an empty DisplayObject", function() {
    var NullComponent = () => { return null; };
    var NullTestComponent = createTestFixture({
        width : 300,
        height : 300,
        subcomponentfactory : React.createFactory(NullComponent),
        subcomponentprops : {}
      });

    var reactinstance = ReactPIXI.render(NullTestComponent,mountpoint);

    // hm, probably need some equivalent of getDOMNode
    expect(reactinstance.refs.stage._displayObject).toBeDefined();
    //This should be a ReactPIXI stage.
    expect(reactinstance.refs.stage.renderStage).toBeDefined();
  });

  var Stage = React.createFactory(ReactPIXI.Stage);
  var DisplayObjectContainer = React.createFactory(ReactPIXI.DisplayObjectContainer);

  var DisplayObjectContainerTestComponent = React.createClass({
    displayName: 'ExampleTilingSpriteComponent',
    render: function () {
      return Stage({width: 800, height: 600, ref: 'stage'},
        DisplayObjectContainer(this.props));
     }
  });

  var DisplayObjectContainerTest = React.createFactory(DisplayObjectContainerTestComponent);

  it('The position property can be updated by x and y props', (done) => {
    var setAndExpect = [
      {x: -420, y: -420, expect: new PIXI.Point(-420, -420)}
    ];

    setAndExpect.forEach( (data) => {
      var reactInstance = ReactPIXI.render(
        DisplayObjectContainerTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          x: data.x,
          y: data.y
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var displayObject = stage.children[0];
      expect(displayObject.x).toBe(data.expect.x);
      expect(displayObject.y).toBe(data.expect.y);
      expect(displayObject.position.x).toBe(data.expect.x);
      expect(displayObject.position.y).toBe(data.expect.y);
    });

    done();
  });

  it('The position property can be updated by position prop in all the various forms', (done) => {
    var setAndExpect = [
      {set: [-420], expect: new PIXI.Point(-420, -420)},
      {set: [169, 532], expect: new PIXI.Point(169, 532)},
      {set: "4", expect: new PIXI.Point(4, 4)},
      {set: "42,68", expect: new PIXI.Point(42, 68)},
      {set: new PIXI.Point(123, 456), expect: new PIXI.Point(123, 456)},
      {set: new PIXI.Point(123), expect: new PIXI.Point(123, 0)},
      {set: new PIXI.ObservablePoint(() => {}, {}, 654, 321), expect: new PIXI.Point(654, 321)}
    ];

    setAndExpect.forEach( (data) => {
      var reactInstance = ReactPIXI.render(
        DisplayObjectContainerTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          position: data.set
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var displayObject = stage.children[0];
      expect(displayObject.x).toBe(data.expect.x);
      expect(displayObject.y).toBe(data.expect.y);
      expect(displayObject.position.x).toBe(data.expect.x);
      expect(displayObject.position.y).toBe(data.expect.y);
    });

    done();
  });

  it('The pivot property can be updated by position prop in all the various forms', (done) => {
    var setAndExpect = [
      {set: [-420], expect: new PIXI.Point(-420, -420)},
      {set: [169, 532], expect: new PIXI.Point(169, 532)},
      {set: "4", expect: new PIXI.Point(4, 4)},
      {set: "42,68", expect: new PIXI.Point(42, 68)},
      {set: new PIXI.Point(123, 456), expect: new PIXI.Point(123, 456)},
      {set: new PIXI.Point(123), expect: new PIXI.Point(123, 0)},
      {set: new PIXI.ObservablePoint(() => {}, {}, 654, 321), expect: new PIXI.Point(654, 321)}
    ];

    setAndExpect.forEach( (data) => {
      var reactInstance = ReactPIXI.render(
        DisplayObjectContainerTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          pivot: data.set
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var displayObject = stage.children[0];
      expect(displayObject.pivot.x).toBe(data.expect.x);
      expect(displayObject.pivot.y).toBe(data.expect.y);
    });

    done();
  });

  it('The scale property can be updated by position prop in all the various forms', (done) => {
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
        DisplayObjectContainerTest({
          // TODO: also set the other tiling transforms (for testing observable points)
          scale: data.set
        }),
        mountpoint
      );

      var stage = reactInstance.refs['stage']._displayObject;
      var displayObject = stage.children[0];
      expect(displayObject.scale.x).toBe(data.expect.x);
      expect(displayObject.scale.y).toBe(data.expect.y);
    });

    done();
  });
});
