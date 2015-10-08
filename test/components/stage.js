

describe("PIXI Stage Component", function() {
  var stagecomponent = createTestFixture({width:300, height:300});
  var mountpoint = null;

  beforeEach(function() { mountpoint = createTestFixtureMountPoint(); });
  afterEach(function() { removeTestFixtureMountPoint(mountpoint); });

  it("creates a canvas used by PIXI", function() {
    ReactPIXI.render(stagecomponent,mountpoint);

    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');
    expect(mountpoint.childNodes[0].childNodes.length).toBe(0);
  });

  it("creates a PIXI Stage object", function() {
    var reactinstance = ReactPIXI.render(stagecomponent,mountpoint);

    // hm, probably need some equivalent of getDOMNode
    expect(reactinstance.refs.stage._displayObject).toBeDefined();
    //This should be a ReactPIXI stage.
    expect(reactinstance.refs.stage.renderStage).toBeDefined();
  });

  it("destroys the canvas when the stage is unmounted", function() {
    reactinstance = ReactPIXI.render(stagecomponent,mountpoint);

    // this should unmount the stage and remove the canvas
    var reactinstance = ReactPIXI.render(React.DOM.div(), mountpoint);

    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).not.toBe('CANVAS');
    expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

    ReactPIXI.unmountComponentAtNode(mountpoint);

    expect(mountpoint.childNodes.length).toBe(0);
  });

  it("passes the context down into pixi elements", function() {

    // this component is a sprite that uses the x/y from the context to position the sprite
    var displayobjectfromcontext = React.createClass({
      displayName:'DisplayObject_PositionFromContext',
      contextTypes: {
	x_context: React.PropTypes.any,
	y_context: React.PropTypes.any
      },
      render: function() {
	console.log(this.context);
	return React.createElement(
	  ReactPIXI.DisplayObjectContainer,
	  {x: this.context.x_context, y: this.context.y_context}
	);
      }
    });
    
    // this component creates a context that contains the desired sprite x/y position
    var TestFixtureWithContext = React.createClass({
      displayName:'TestFixtureWithContext',
      childContextTypes: {
	x_context: React.PropTypes.any,
	y_context: React.PropTypes.any
      },
      getChildContext: function() {
	return {
	  x_context: this.props.sprite_x,
	  y_context: this.props.sprite_y
	};
      },
      render: function() {
	var stageprops = {width:this.props.width, height:this.props.height, ref:'stage'};

	// note that displayobject  x/y are not passed down in the props, but must
	// be obtained from the context
	return React.createElement(ReactPIXI.Stage,
				   stageprops,
				   React.createElement(displayobjectfromcontext)
				  );
      }
    });
						   
    var contextcomponent = React.createElement(
      TestFixtureWithContext,
      {
	width: 300,
	height: 300,
	sprite_x: 51,
	sprite_y: 52,
      });

    var reactinstance = ReactPIXI.render(contextcomponent, mountpoint);

    // if the context was passed in the sprite x/y should have been
    // determined by the x/y values in the context
    var stage = reactinstance.refs.stage._displayObject;
    expect(stage.children[0].x).toBe(51);
    expect(stage.children[0].y).toBe(52);
  });
});
