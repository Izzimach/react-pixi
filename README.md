react-pixi
==========

Create/control a [Pixi.js](https://github.com/GoodBoyDigital/pixi.js) canvas using [React](https://github.com/facebook/react).


## Installation

You will need node and npm. You should probably install gulp globally as well.

```
npm install -g gulp
npm install
gulp
```

Will package up react-pixi along with React and put the result in build/react-pixi.js. Unlike standard React, you'll need
to pull in the desired React and React.PIXI modules in your javascript code:

```
var React = require('react');
React.PIXI = require(react-pixi');
```


## Rendering Pixi.js elements

To render Pixi.js elements like a Stage or Sprite you reference them the same way you referenced DOM elements in
vanilla React.  For example, to construct a CupcakeComponent that consists of two Sprites:

```
var CupcakeComponent = React.createClass({
  displayName: 'CupcakeComponent',
  // maps from cupcake toppings to the appropriate sprite
  spritemapping : {
  'vanilla' : 'creamVanilla.png',
  'chocolate' : 'creamChoco.png',
  'mocha' : 'creamMocha.png',
  'pink' : 'creamPink.png',
  },

  render : function () {
    var creamimagename = this.spritemapping[this.props.topping];
    var xposition = this.props.xposition;
    return React.PIXI.DisplayObjectContainer({x:xposition, y:100 },
      [
        React.PIXI.Sprite({image:creamimagename, y:-35, anchor: new PIXI.Point(0.5,0.5), key:'topping'}, null),
        React.PIXI.Sprite({image:'cupCake.png', y:35, anchor: new PIXI.Point(0.5,0.5), key:'cake'}, null)
      ]
    );
  }
});
```

[Sample Cupcake component](docs/react-pixi-devshot.png?rawpage)

Note that at the moment you need to mount onto a DOM component so your top-level component will probably be a React.PIXI.Stage.

Look in the examples directory for more in-depth examples

## Testing

Testing is done via gulp and karma.

```
gulp test
```

## Caveats

Lots of things are still missing. Specifically:
- No PIXI filters.
- Events are not generated and fed back to React.
- You can't use JSX to generate PIXI components.

