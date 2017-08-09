//
// Basic React-PIXI example using a custom 'Cupcake' Component which consists of two sprites
//

/* jshint strict: false */
/* global React : false */
/* global ReactPIXI : false */
/* global PIXI : false */
/* global createReactClass : false */

var assetpath = function(filename) { return '../assets/' + filename; };

var Stage = ReactPIXI.Stage;
var TilingSprite = ReactPIXI.TilingSprite;
var VectorText = ReactPIXI.Text;

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - xposition: x position in pixels that governs where the elements are placed
//

var ExampleStage = createReactClass({
  displayName: 'ExampleStage',
  render: function() {
    var fontstyle = {font:'40px Times'};
    return <Stage width={this.props.width} height={this.props.height}>
      <TilingSprite image={assetpath('bg_castle.png')} width={this.props.width} height={this.props.height} key="1" />
      <VectorText text="Vector text" x={this.props.xposition} y={10} style={fontstyle} anchor={new PIXI.Point(0.5,0)} key="2" />
    </Stage>;
  }
});

/* jshint unused:false */
function jsxtransformstart() {
    var renderelement = document.getElementById("pixi-box");

    function PutReact()
    {
      var stageElement = <ExampleStage width={600} height={400} xposition={200} topping="vanilla" />;
      ReactPIXI.render(stageElement, renderelement);
    }

    // we need to preload the vector font before creating any text
    var fontloader = PIXI.loader;
    fontloader.add('comic_neue_angular_bold', assetpath('comic_neue_angular_bold.fnt'));
    fontloader.on('complete', PutReact);
    fontloader.load();
}

// let's start!
jsxtransformstart();

