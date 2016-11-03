//
// Basic React-PIXI example using a custom 'Cupcake' Component which consists of two sprites
//

/* jshint strict: false */
/* global React : false */
/* global ReactPIXI : false */
/* global PIXI : false */

var assetpath = function(filename) { return '../assets/' + filename; };

var Stage = React.createFactory(ReactPIXI.Stage);
var Sprite = React.createFactory(ReactPIXI.Sprite);
var DisplayObjectContainer = React.createFactory(ReactPIXI.DisplayObjectContainer);
var TilingSprite = React.createFactory(ReactPIXI.TilingSprite);
var VectorText = React.createFactory(ReactPIXI.Text);
var BitmapText = React.createFactory(ReactPIXI.BitmapText);

//
// Here's a cupcake component that gloms together two sprites to render a cupcake
//
// props:
// - xposition : center x axis of the cupcake
// - cream : type of cupcake topping. any of the keys listed in spritemapping
//

var CupcakeComponent = React.createClass({
  displayName: 'CupcakeComponent',
  // maps from cupcake toppings to the appropriate sprite
  spritemapping : {
  'vanilla' : assetpath('creamVanilla.png'),
  'chocolate' : assetpath('creamChoco.png'),
  'mocha' : assetpath('creamMocha.png'),
  'pink' : assetpath('creamPink.png'),
  },

  propTypes: {
    xposition: React.PropTypes.number.isRequired,
    topping: React.PropTypes.string.isRequired,
  },

  render : function () {
    var creamimagename = this.spritemapping[this.props.topping];
    var xposition = this.props.xposition;
    return DisplayObjectContainer(
      {x:xposition, y:100 },
      Sprite({image:creamimagename, y:-35, anchor: new PIXI.Point(0.5,0.5), key:'topping'}, null),
      Sprite({image:assetpath('cupCake.png'), y:35, anchor: new PIXI.Point(0.5,0.5), key:'cake'}, null)
    );
  }
});
var CupcakeFactory = React.createFactory(CupcakeComponent);

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - xposition: x position in pixels that governs where the elements are placed
//

var ExampleStage = React.createClass({
  displayName: 'ExampleStage',
  getInitialState: function() {
    return {backgroundX: 0, backgroundY: 0, scrollcallback:null};
  },
  componentDidMount: function() {
    var componentinstance = this;
    var animationcallback = function() {
      var newstate = {
        backgroundX: componentinstance.state.backgroundX - 1,
        backgroundY: componentinstance.state.backgroundY - 2,
        scrollcallback: requestAnimationFrame(animationcallback)
      };

      componentinstance.setState(newstate);
    }.bind(this);

    componentinstance.setState({scrollcallback: requestAnimationFrame(animationcallback)});
  },
  componentWillUnmount: function() {
    if (this.state.scrollcallback !== null) {
      cancelAnimationFrame(this.state.scrollcallback);
    }
  },
  render: function() {
    return Stage(
      {width:this.props.width, height:this.props.height},
      TilingSprite({image:assetpath('bg_castle.png'), width:this.props.width, height:this.props.height, tilePosition: [this.state.backgroundX, this.state.backgroundY], key:1}, null),
      CupcakeFactory({topping:this.props.topping, xposition:this.props.xposition, ref:'cupcake', key:2}),
      VectorText({text:'Vector text', x:this.props.xposition, y:10, style:{font:'40px Times'}, anchor: new PIXI.Point(0.5,0), key:3}, null),
      BitmapText({text:'Bitmap text', x:this.props.xposition, y:180, tint:0xff88ff88, style: {font:'40 Comic_Neue_Angular'}, key:4}, null)
    );
  }
});

/* jshint unused:false */
function cupcakestart() {
    var renderelement = document.getElementById("pixi-box");

    var w = window.innerWidth-6;
    var h = window.innerHeight-6;

    function PutReact()
    {
      var stageElement = React.createElement(ExampleStage, {width:w, height:h, xposition:200, topping:'vanilla'});
      ReactPIXI.render(stageElement, renderelement);
    }

    var fontloader = PIXI.loader;
    fontloader.add('comic_neue_angular_bold', assetpath('comic_neue_angular_bold.fnt'));
    fontloader.on('complete', PutReact);
    fontloader.load();
}
