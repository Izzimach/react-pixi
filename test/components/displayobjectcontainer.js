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
  var VariableChildrenComponent = ReactPIXI.createClass({
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
    var reactinstance = React.render(VariableChildrenTest(1),mountpoint);

    var stage = reactinstance.refs['stage'].displayObject;
    var testpoint = stage.children[0];

    expect(testpoint.parent).toBe(stage);
  });

  it("can hold a variable number of children", function() {

    for (var numchildren = 0; numchildren < maxtestchildren; numchildren++) {
      var reactinstance = React.render(
        VariableChildrenTest(numchildren),
        mountpoint);

      expect(mountpoint.childNodes.length).toBe(1);
      expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].displayObject;
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
    var reactinstance = React.render(
      VariableChildrenTest(0),
      mountpoint);

    for (var numchildren = 1; numchildren < maxtestchildren; numchildren++) {

      // this should add another DisplayObject as a child
      reactinstance = React.render(
        VariableChildrenTest(numchildren),
        mountpoint);

      expect(mountpoint.childNodes.length).toBe(1);
      expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, not DOM nodes
      expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].displayObject;
      var testpoint = stage.children[0];

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);

      // here we don't unmount, so that the next time through React has to
      // add children instead of building them anew.
    }
  });

  it("can remove DisplayObjects from an already-mounted tree", function() {
    var reactinstance = React.render(
      VariableChildrenTest(maxtestchildren),
      mountpoint);

    for (var numchildren = maxtestchildren-1; numchildren > 0; numchildren--) {

      // this should remove an already existing child
      var reactinstance = React.render(
        VariableChildrenTest(numchildren),
        mountpoint);

      expect(mountpoint.childNodes.length).toBe(1);
      expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].displayObject;
      var testpoint = stage.children[0];

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);
    }
  });

  it("correctly replaces PIXI objects instead of setting HTML markup when replacing components in-place", function() {
    var DisplayObject = React.createFactory(ReactPIXI.DisplayObject);
    var Stage = React.createFactory(ReactPIXI.Stage);

    //
    // This occurs when a composite element is updated in-place. To create this (admittedly uncommon)
    // situation we create a composite component that changes the key of its child while everything else
    // (including the key of the composite element) remains unchanged.  In this case _updateChildren in ReactMultiChildMixin
    // will update in-place and then updateComponent in ReactCompositeComponentMixin will try to nuke and replace the child
    // component since the keys don't match.
    //
    var injectedKeyComponent = ReactPIXI.createClass({
      displayName: 'injectedKeyComponent',
      render: function () {
        var propswithkey = _.clone(this.props);
        propswithkey.key = this.props.injectedkey;
        return DisplayObjectContainer(propswithkey);
      }
    });
    var injectedKeyFactory = React.createFactory(injectedKeyComponent);

    // note we use React.createClass, not ReactPIXI.createClass, since the Stage
    // is actually a <canvas> DOM element!
    var injectedKeyStage = React.createClass({
      displayName: 'injectedKeyStage',
      render: function () {
        return Stage({width:this.props.width, height:this.props.height, ref:'stage'},
                               injectedKeyFactory({x:100, y:100, key: 'argh', injectedkey:this.props.injectedkey}));
      }
    });
    var injectedKeyStageFactory = React.createFactory(injectedKeyStage);

    // generate two sets of props, identical except that they contain different
    // values of injectedkey.

    var baseprops = {width:300, height:300, key:'argh'};
    var addinjectedkey = function(originalprops, injectedkey) {
      var newprops = _.clone(originalprops);
      newprops.injectedkey = injectedkey;
      return newprops;
    };
    var props1 = addinjectedkey(baseprops, 'one');
    var props2 = addinjectedkey(baseprops, 'two');

    //
    // render with the original set of props, then again with a new injected key.
    // this should keep the same injectedKeyComponent instance but force React to
    // replace the DisplayObjectContainer inside of injectedKeyComponent. If we
    // don't switch to a different key then React will just update the current instance
    // of DisplayObjectContainer instead of try to replace it.
    //
    var reactinstance = React.render(injectedKeyStageFactory(props1),mountpoint);

    // this should destroy and replace the child instance instead of updating it
    reactinstance.setProps(props2);

    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

    // the tree from here on down is pixi objects, not DOM nodes
    expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

    // examine the pixi objects
    var stage = reactinstance.refs['stage'].displayObject;
    expect(stage.children.length).toBe(1);
  })
});
