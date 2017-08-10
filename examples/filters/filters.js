//
// React-PIXI example applying a blur filter to the cupcake thing
//

/* jshint strict: false */
/* global React : false */
/* global PropTypes : false */
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
// Here's a cupcake component that lets you apply some amount of blur
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
    xposition: PropTypes.number.isRequired,
    topping: PropTypes.string.isRequired,
  },

  render : function () {
    var creamimagename = this.spritemapping[this.props.topping];
    var xposition = this.props.xposition;
    var imageanchor = new PIXI.Point(0.5,0.5);
    return DisplayObjectContainer(
      {x:xposition, y:100},
      Sprite({image:creamimagename, y:-35, anchor: imageanchor, key:'topping'}, null),
      Sprite({image:assetpath('cupCake.png'), y:35, anchor: imageanchor, key:'cake'}, null)
    );
  }
});
var CupcakeFactory = React.createFactory(CupcakeComponent);

//
// This is a cupcake component which is blurred by a pixi filter.
// It also have a text note showing the amount of blur being applied.
//
// props:
// - xposition & cream are as with CupcakeComponent
// - bluramount: 0=no blur, 2=a bit fuzzy, 10+ is mostly obscured
//

var BlurredCupcakeComponent = React.createClass({
  displayName: "BlurredCupcakeComponent",
  getInitialState : function() {
    return { cupcakefilter : new PIXI.filters.BlurFilter() };
  },

  propTypes: {
    xposition: PropTypes.number.isRequired,
    topping: PropTypes.string.isRequired,
    bluramount: PropTypes.number.isRequired
  },

  render : function() {
    var blurfilter = this.state.cupcakefilter;
    blurfilter.blur = this.props.bluramount;
    blurfilter.padding = 1; // too high and the right starts to crop...
    var blurmessage = 'Blur=' + this.props.bluramount.toString();
    return DisplayObjectContainer(
      {},
      BitmapText({text:blurmessage, x:this.props.xposition, y:180, tint:0xff88ff88, style: {font:'20 Comic_Neue_Angular'}, key:4}, null),
      DisplayObjectContainer(
	{x:0,y:0, filters: [blurfilter]},
	CupcakeFactory({xposition:this.props.xposition, topping:this.props.topping})
      )
    );
  }
});
var BlurredCupcakeFactory = React.createFactory(BlurredCupcakeComponent);

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - xposition: x position in pixels that governs where the elements are placed
//

var ExampleStage = React.createClass({
  displayName: 'ExampleStage',
  render: function() {
    // draw two cupcakes each at different positions
    var xpos1 = this.props.xposition;
    var xpos2 = this.props.xposition+200;
    return Stage(
      {width:this.props.width, height:this.props.height},
      TilingSprite({image:assetpath('bg_castle.png'), width:this.props.width, height:this.props.height, key:1}, null),
      BlurredCupcakeFactory({topping:this.props.topping, xposition:xpos1, bluramount: 1, ref:'cupcake1', key:2}),
      BlurredCupcakeFactory({topping:this.props.topping, xposition:xpos2, bluramount: 3, ref:'cupcake2', key:3})
    );
  }
});

/* jshint unused:false */
function filterstart() {
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
