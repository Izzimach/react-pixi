//
// Basic React-PIXI example using components that render null
//
// PIXI Stage can be rendered anywhere in the DOM tree (but not the other way)
//
// Single component returning null is used here to show that it will still
// render regardless of the context it's rendered in (either DOM or PIXI)
//

/* jshint strict: false */
/* global React : false */
/* global ReactPIXI : false */

var Stage = React.createFactory(ReactPIXI.Stage);

var NullReactComponent = React.createClass({
  displayName: 'NullReactComponent',
  render: function() {
    return null;
  }
});

/* jshint unused:false */
function nullrenderstart() {

  // react mounts on this element
    var renderelement = document.getElementById("pixi-box");
    var w = window.innerWidth-6;
    var h = window.innerHeight-6;

  var textStyle = {
    color: 'white',
    fill: 'white',
    fontFamily: 'Arial',
    fontSize: 20
  }
  ReactPIXI.render(
      React.createElement('div', {}, [
        // DOM elements
        React.createElement('p', {key: 'text-dom-1', style: textStyle}, 'Before null DOM element'),
        React.createElement(NullReactComponent, {key: 'null-dom-1'}),
        React.createElement('p', {key: 'text-dom-2', style: textStyle}, 'After null DOM element'),
        // PIXI elements
        React.createElement(ReactPIXI.Stage, {key: 'stage-1', width:w, height:h}, [
          React.createElement(ReactPIXI.Text, {key: 'text-pixi-1', text: 'Before null PIXI element', style: textStyle, position: {x: 0, y: 0}}),
          React.createElement(NullReactComponent, {key: 'null-pixi-1'}),
          React.createElement(ReactPIXI.Text, {key: 'text-pixi-2', text: 'After null PIXI element', style: textStyle, position: {x: 0, y: 50}})
        ])
      ]
    ), renderelement);
}
