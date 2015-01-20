

describe("PIXI Stage Component", function() {
  var stagecomponent = createTestFixture({width:300, height:300});
  var mountpoint = null;

  beforeEach(function() { mountpoint = createTestFixtureMountPoint(); });
  afterEach(function() { removeTestFixtureMountPoint(mountpoint); });

  it("creates a canvas used by PIXI", function() {
    React.render(stagecomponent,mountpoint);

    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');
    expect(mountpoint.childNodes[0].childNodes.length).toBe(0);
  });

  it("creates a PIXI Stage object", function() {
    var reactinstance = React.render(stagecomponent,mountpoint);

    // hm, probably need some equivalent of getDOMNode
    expect(reactinstance.refs['stage'].displayObject).toBeDefined();

    var stageobject = reactinstance.refs['stage'].displayObject;
    expect(stageobject.stage).toBeDefined();

    // stages are their own stage
    expect(stageobject.stage).toBe(stageobject);
  });

  it("destroys the canvas when the stage is unmounted", function() {
    reactinstance = React.render(stagecomponent,mountpoint);

    // this should unmount the stage and remove the canvas
    var reactinstance = React.render(React.DOM.div(), mountpoint);

    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).not.toBe('CANVAS');
    expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

    React.unmountComponentAtNode(mountpoint);

    expect(mountpoint.childNodes.length).toBe(0);
  });
});
