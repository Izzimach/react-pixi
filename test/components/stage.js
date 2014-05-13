

describe("PIXI Stage Component", function() {
  var stagecomponent = React.PIXI.Stage({width:300, height:300});

  function createTestFixture() {
    var fixture = window.document.createElement('div');
    fixture.id = 'test-fixture';
    window.document.body.appendChild(fixture);
    return fixture;
  }

  function removeTestFixture() {
    var fixture = window.document.getElementById('test-fixture');
    fixture.parentNode.removeChild(fixture);
    return null;
  }

  beforeEach(createTestFixture);

  afterEach(removeTestFixture);

  it("creates a canvas used by PIXI", function() {
    var fixture = window.document.getElementById('test-fixture');

    React.renderComponent(stagecomponent,fixture);

    expect(fixture.childNodes.length).toBe(1);
    expect(fixture.childNodes[0].nodeName).toBe('CANVAS');
    expect(fixture.childNodes[0].childNodes.length).toBe(0);

    React.unmountComponentAtNode(fixture);
  });

  it("creates a PIXI Stage object", function() {
    var fixture = window.document.getElementById('test-fixture');

    var reactinstance = React.renderComponent(stagecomponent,fixture);

    // hm, probably need some equivalent of getDOMNode
    expect(reactinstance.displayObject).toBeDefined();
    var stageobject = reactinstance.displayObject;
    expect(stageobject.stage).toBeDefined();

    // stages are their own stage
    expect(stageobject.stage).toBe(stageobject);

    React.unmountComponentAtNode(fixture);
  });

  it("destroys the canvas when the stage is unmounted", function() {
    var fixture = window.document.getElementById('test-fixture');

    reactinstance = React.renderComponent(stagecomponent,fixture);

    // this should unmount the stage and remove the canvas
    var reactinstance = React.renderComponent(React.DOM.div(), fixture);

    expect(fixture.childNodes.length).toBe(1);
    expect(fixture.childNodes[0].nodeName).not.toBe('CANVAS');
    expect(fixture.childNodes[0].childNodes.length).toBe(0);

    React.unmountComponentAtNode(fixture);

    expect(fixture.childNodes.length).toBe(0);
  });
});
