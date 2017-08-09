//
// Basic ReactPIXI example using pixi events to add/remove sprites.
// Note that in order for a sprite to be clickable the sprite has
// to be interactive (sprite.interactive = true)
//
// For react-pixi this means you should have 'interactive:true' in your props
//

// tell jshint that we use lodash
/* global _ : false */
/* global React : false */
/* global PropTypes : false */
/* global ReactPIXI : false */
/* global PIXI : false */
/* jshint strict: false */

var Stage = React.createFactory(ReactPIXI.Stage);
var Sprite = React.createFactory(ReactPIXI.Sprite);
var DisplayObjectContainer = React.createFactory(ReactPIXI.DisplayObjectContainer);
var TilingSprite = React.createFactory(ReactPIXI.TilingSprite);
var VectorText = React.createFactory(ReactPIXI.Text);
var BitmapText = React.createFactory(ReactPIXI.BitmapText);


var g_assetpath = function(filename) { return '../assets/' + filename; };

// DOM element on which we mount the PIXI canvas
var g_renderelement;

// This basically the 'application state':
// a list of all the current sprites
var g_applicationstate = {};

var g_nextspriteid = 1;

// if the application state is modified call this to update the GUI

function updateProps()
{
  ReactPIXI.render(React.createElement(SpriteApp,g_applicationstate), g_renderelement);
}

//
// Deleting an interactive sprite while inside a pixi event handler can modify the 'interactiveItems'
// arry while pixi is iterating over it, which is a no-no.
// So instead we queue up the change using setTimeout
//
function enqueueSetProps() {
  window.setTimeout(updateProps);
}

//
// callback which adds a randomly placed sprite to the application state
//

function addRandomSprite() {
  // give each sprite a unique ID
  var refnumber = g_nextspriteid++;
  var spriteid = 'sprite' + refnumber.toString();

  var newsprite = {
    x: Math.random() * g_applicationstate.width,
    y: Math.random() * g_applicationstate.height,
    alpha: 0.7,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    image: g_assetpath('lollipopGreen.png'),
    key: spriteid,
    interactive:true,
    click: function() { removeSpriteById(spriteid); }
  };

  g_applicationstate.sprites.push(newsprite);

  // update and re-render
  updateProps();
}

//
// callback to remove the dynamic sprite that was clicked on
//

function removeSpriteById(spriteid) {
  _.remove(g_applicationstate.sprites, function(sprite) { return sprite.key === spriteid; });

  enqueueSetProps();
}

//
// Component to hold a clickable sprite 'button'. click on this 'button' to add a sprite
//

var SpriteAppButtons = React.createClass({
  displayName:'SpriteAppButtons',
  render: function() {
    return DisplayObjectContainer(
      {},
      Sprite({x:100,y:150,key:'cherry', image: g_assetpath('cherry.png'),interactive:true,click: addRandomSprite}),
      VectorText({x:10,y:10, key:'label1', text:'Click the cherry to add a lollipop sprite', style:{font:'25px Times'}}),
      VectorText({x:10,y:80, key:'label2', text:'Click on lollipop sprites to remove them', style:{font:'25px Times'}})
    );
  }
});

//
// Component to display all the dynamic sprites
//

var DynamicSprites = React.createClass({
  displayName:'DynamicSprites',
  propTypes: {
    sprites: PropTypes.arrayOf(PropTypes.object)
  },
  render: function() {
    var args = [{}];
    this.props.sprites.forEach(function(spriteprops) {
      args.push(Sprite(spriteprops));
    });
    return DisplayObjectContainer.apply(
      null,
      args
    );
  }
});

//
// A Spin component
// Dynamically spins a component/node around a certain coordinate
// props:
// - x,y are the point to spin around
// - spinspeed is the rotation speed in radians/sec
// - spinme is a ReactElement to spin
var SpinElement = React.createClass({
  displayName: 'SpinElement',
  propTypes: {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    spinspeed: PropTypes.number.isRequired,
    spinme: PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {clusterrotation:0, spincallback:null};
  },
  componentDidMount: function() {
    var componentinstance = this;
    var animationcallback = function(/*t*/) {
      var newrotation = componentinstance.state.clusterrotation + this.props.spinspeed * 0.016;// use timestamp passed in!!!

      var newstate = {
        clusterrotation: newrotation,
        spincallback:requestAnimationFrame(animationcallback)
      };
      componentinstance.setState(newstate);
    }.bind(this);

    // add an interval timer function to rotate the camera
    componentinstance.setState({spincallback:requestAnimationFrame(animationcallback)});
  },
  componentWillUnmount: function() {
    if (this.state.spincallback !== null) {
      cancelAnimationFrame(this.state.spincallback);
    }
  },
  render: function () {
    var spinatprops = {x:this.props.x, y:this.props.y, rotation:this.state.clusterrotation};

    // the first DisplayObjectContainer offsets everything so we need to wrap another
    // DoC to move everythiing back into place
    var restoreoffsetprops = {x:-this.props.x, y:-this.props.y};

    return DisplayObjectContainer(spinatprops,
                                  DisplayObjectContainer(restoreoffsetprops,
                                                         this.props.spinme));
  }
});

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - sprites: a list of objects describing all the current sprites containing x,y and image fields
//

var SpriteApp = React.createClass({
  displayName: 'BunchOfSprites',
  render: function() {
    var halfwidth = this.props.width/2;
    var halfheight = this.props.height/2;
    var dynamicspriteselement = React.createElement(DynamicSprites, {key:'sprites', sprites:this.props.sprites});

    return Stage(
      // stage props
      {width: this.props.width, height: this.props.height, backgroundcolor: 0xa08080, interactive:true},
      // children components are the buttons and the dynamic sprites
      React.createElement(SpriteAppButtons, {key:'gui'}),
      React.createElement(SpinElement,{x:halfwidth, y:halfheight, spinspeed:1, spinme:dynamicspriteselement})
    );
  }
});

/* jshint unused:false */
function interactiveexamplestart() {

  g_renderelement = document.getElementById("pixi-box");

  var w = window.innerWidth-6;
  var h = window.innerHeight-6;

  g_applicationstate = {width:w, height:h, sprites:[]};

  var loader = PIXI.loader;
  loader.add('cherry', g_assetpath('cherry.png'));
  loader.add('lollipopGreen', g_assetpath('lollipopGreen.png'));
  loader.add('lollipopRed', g_assetpath('lollipopRed.png'));

  loader.once('complete', updateProps);
  loader.load();
}
