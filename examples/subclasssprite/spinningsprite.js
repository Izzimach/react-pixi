//
// Basic React-PIXI example using a custom PIXI object that is a subclass of Sprite.
// The object spins in place using a speed specified in the component properties as 'rotationspeed'
// which is the rotation speed in radians/second
//

/* jshint strict: false */
/* global React : false */
/* global ReactPIXI : false */

var assetpath = function(filename) { return '../assets/' + filename; };

var SpinningSprite = function(rotationspeed) {
  PIXI.Sprite.call(this);
  this.rotationspeed = rotationspeed;

  this.animrequestID = window.requestAnimationFrame(this.newFrame);
};

SpinningSprite.prototype = Object.create( PIXI.Sprite.prototype, {
  constructor : SpinningSprite,

  newFrame : function(timestamp) {
    this.rotation = this.rotationspeed * timestamp * 0.001;
    this.animrequestID = window.requestAnimationFrame(this.newFrame);
  },

  cancelAnimation : function() {
    if (this.animrequestID !== null) {
      window.cancelAnimationFrame(this.animrequestID);
      this.animrequestID = null;
    }
  }
});

var SpinningSpriteComponent = ReactPIXI.CreateCustomPIXIComponent({
  customDisplayObject : function() {

  },

  applyCustomProps : function(oldProps, newProps) {

  }
});

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - spinx,spiny,spinrotation : parameters passed to the spinning sprite
//

var SpinStage = React.createClass({
  displayName: 'ExampleStage',
  render: function() {
    var children = [
      SpinningSpriteComponent({x:this.props.spinx, y:this.props.spiny, rotation:this.props.spinrotation}, null)
    ];
    return ReactPIXI.Stage({width:this.props.width, height:this.props.height}, children);
  }
});

/* jshint unused:false */
function spinningspritestart() {
    var renderelement = document.getElementById("pixi-box");

    var w = window.innerWidth-6;
    var h = window.innerHeight-6;

    React.renderComponent(SpinStage({width:w, height:h, spinx:100, spiny:100, spinrotation:1}), renderelement);
}

