react-pixi
==========

[![Build Status](https://travis-ci.org/Izzimach/react-pixi.svg?branch=master)](https://travis-ci.org/Izzimach/react-pixi)

Create/control a [Pixi.js](https://github.com/GoodBoyDigital/pixi.js) canvas using [React](https://github.com/facebook/react).

To control a 3D scene with React, see [react-three](https://github.com/Izzimach/react-three/)

![Applying blur with a PIXI filter](docs/blurexample.png)

## Install Via Bower

If you just want to use react-pixi and not build it, you can
install it using bower.

```
bower install react-pixi
```

Then include one of the javascript files in dist, such as dist/react-pixi.js.  You will also need to include Pixi:

```
<script src="bower_components/pixi.js/bin/pixi.dev.js"></script>
<script src="bower_components/react-pixi/dist/react-pixi.js"></script>
```

React willappear in the global namespace as `React` and the new React-PIXI components are available under the `ReactPIXI` namespace.

Note that react-pixi includes its own internal copy of React (currently 0.12.1)
so you should not include the standard React library. Doing so might give wierd results!


## Building From Source

You will need node and  npm. You should probably install gulp globally as well.

```
npm install -g gulp
npm install
bower install
```

Simply running

```
gulp
```

Will package up react-pixi along with React and put the result in build/react-pixi.js, which you can include in your web page.



## Rendering Pixi.js elements

To render Pixi.js elements like a Stage or Sprite you reference them like other
components that were created with `React.createClass`.  For React 0.12 and later,
this means you have to use `React.createElement` or create factories from the
basic ReactPIXI components. For example, to construct
 a CupcakeComponent that consists of two Sprites:

```javascript
var Sprite = React.createFactory(ReactPIXI.Sprite);
var DisplayObjectContainer = React.createFactory(ReactPIXI.DisplayObjectContainer);

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
    return DisplayObjectContainer(
      {x:xposition, y:100 },
        Sprite({image:creamimagename, y:-35, anchor: new PIXI.Point(0.5,0.5), key:'topping'}, null),
        Sprite({image:assetpath('cupCake.png'), y:35, anchor: new PIXI.Point(0.5,0.5), key:'cake'}, null)
    );
  }
});
```
(taken from the [cupcake example](examples/cupcake/cupcake.js))
![Sample Cupcake component](docs/react-pixi-devshot.png)

Note that at the moment you need to mount onto a DOM component so your top-level component will probably be a ReactPIXI.Stage.

Look in the examples directory for more in-depth examples.

## Rendering via JSX

You can produce display elements using JSX as well. Note that you don't need
factories in this case.

```javascript
var Stage = ReactPIXI.Stage;
var TilingSprite = ReactPIXI.TilingSprite;
var Text = ReactPIXI.Text;

var ExampleStage = React.createClass({
  displayName: 'ExampleStage',
  render: function() {
    var fontstyle = {font:'40px Times'};
    return <Stage width={this.props.width} height={this.props.height}>
    <TilingSprite image={assetpath('bg_castle.png')} width={this.props.width} height={this.props.height} key="1" />
    <Text text="Vector text" x={this.props.xposition} y={10} style={fontstyle} anchor={new PIXI.Point(0.5,0)} key="2" />
    </Stage>;
  }
});
```

## Testing

Testing is done via gulp and karma.

```
gulp test
```

to (re)generate the pixel reference images you will need to have phantomjs installed, then

```
gulp pixelrefs
```

## Caveats

- Callbacks are just callbacks. They don't feed into React's event system.
