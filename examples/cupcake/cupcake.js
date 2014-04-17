//
// Basic React.PIXI example using a custom 'Cupcake' Component which consists of two sprites
//

var React = require('react');
React.PIXI = require('react-pixi');

var assetpath = function(filename) { return '../assets/' + filename; }

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

  render : function () {
    var creamimagename = this.spritemapping[this.props.topping];
    var xposition = this.props.xposition;
    return React.PIXI.DisplayObjectContainer({x:xposition, y:100 },
      [
        React.PIXI.Sprite({image:creamimagename, y:-35, anchor: new PIXI.Point(0.5,0.5), key:'topping'}, null),
        React.PIXI.Sprite({image:assetpath('cupCake.png'), y:35, anchor: new PIXI.Point(0.5,0.5), key:'cake'}, null)
      ]
    );
  }
});

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - xposition: x position in pixels that governs where the elements are placed
//

var ExampleStage = React.createClass({
  displayName: 'ExampleStage',
  render: function() {
    var children = [
      React.PIXI.TilingSprite({image:assetpath('bg_castle.png'), width:this.props.width, height:this.props.height, key:1}, null),
      CupcakeComponent({topping:this.props.topping, xposition:this.props.xposition, ref:'cupcake', key:2}),
      React.PIXI.Text({text:'Vector text', x:this.props.xposition, y:10, style:{font:'40px Times'}, anchor: new PIXI.Point(0.5,0), key:3}, null),
      React.PIXI.BitmapText({text:'Bitmap text', x:this.props.xposition, y:180, tint:0xff88ff88, style: {font:'40 Comic_Neue_Angular'}, key:4}, null)
    ];
    return React.PIXI.Stage({width:this.props.width, height:this.props.height}, children);
  }
});

function cupcakestart() {
    var renderelement = document.getElementById("pixi-box");

    var w = window.innerWidth-6;
    var h = window.innerHeight-6;

    function PutReact()
    {
          React.renderComponent(ExampleStage({width:w, height:h, xposition:200, topping:'vanilla'}), renderelement);
          //React.renderComponent(ExampleStage({width:w, height:h, xposition:200, topping:'pink'}), renderelement);
    }

    var fontloader = new PIXI.BitmapFontLoader(assetpath('comic_neue_angular_bold.fnt'));
    fontloader.on('loaded', PutReact);
    fontloader.load();
}

