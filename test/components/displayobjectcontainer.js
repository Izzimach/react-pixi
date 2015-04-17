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
    var reactinstance = React.render(VariableChildrenTest(1),mountpoint);

    var stage = reactinstance.refs['stage']._displayObject;
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
      var stage = reactinstance.refs['stage']._displayObject;
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
      var stage = reactinstance.refs['stage']._displayObject;
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
      var stage = reactinstance.refs['stage']._displayObject;
      var testpoint = stage.children[0];

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);
    }
  });

});
