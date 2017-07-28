//
// Basic React-PIXI example using a custom render
//

/* jshint strict: false */
/* global React : false */
/* global ReactPIXI : false */
/* global PIXI : false */

var assetpath = function(filename) { return '../assets/' + filename; };

var Stage = React.createFactory(ReactPIXI.Stage);
var VectorText = React.createFactory(ReactPIXI.Text);

var CustomRenderStage = React.createClass({
  displayName: 'CustomRenderStage',
  render: function() {
    return Stage(
      {width:this.props.width, height:this.props.height, renderer:this.props.renderer},
      VectorText({text:'Vector text', x:200, y:10, style:{fontFamily: 'Times', fontSize:40, fill:0xff1010}, anchor: new PIXI.Point(0.5,0), key:3}, null),
    );
  }
});

/* jshint unused:false */
function customrenderstart() {

  // react mounts on this element
    var renderelement = document.getElementById("pixi-box");
    var w = window.innerWidth-6;
    var h = window.innerHeight-6;

    const renderer = PIXI.autoDetectRenderer({
      width: w,
      height: h,
    });
    document.getElementById("customcanvas").appendChild(renderer.view);

    var stageElement = React.createElement(CustomRenderStage, {width:w, height:h, renderer:renderer});
    ReactPIXI.render(stageElement, renderelement);
}
