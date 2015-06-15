
/*
 * Copyright (c) 2014-2015 Gary Haussmann
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//
// Lots of code here is based on react-art: https://github.com/facebook/react-art
//



"use strict";

var React = require('react');
var PIXI = require('pixi.js');

var ReactUpdates = require('react/lib/ReactUpdates');
var ReactMultiChild = require('react/lib/ReactMultiChild');
var ReactElement  = require('react/lib/ReactElement');
var ReactUpdates = require('react/lib/ReactUpdates');

var assign = require('react/lib/Object.assign');
var emptyObject = require('react/lib/emptyObject');
var invariant = require('react/lib/invariant');

var monkeypatch = require('./ReactPIXIMonkeyPatch');
monkeypatch();

//
// Generates a React component by combining several mixin components
//

function createPIXIComponent(name) {

  var ReactPIXIComponent = function(props) {
    /* jshint unused: vars */
    this.node = null;
    this._mountImage = null;
    this._renderedChildren = null;
    this._displayObject = null;
  };
  ReactPIXIComponent.displayName = name;
  for (var i = 1; i < arguments.length; i++) {
    assign(ReactPIXIComponent.prototype, arguments[i]);
  }

  return ReactPIXIComponent;
}

//
// A DisplayObject has some standard properties and default values
//

var gStandardProps = {
  alpha: 1,
  buttonMode:false,
  cacheAsBitmap:null,
  defaultCursor:'pointer',
  filterArea:null,
  filters:null,
  hitArea:null,
  interactive:false,
  mask:null,
  // can't set parent!
  pivot: new PIXI.Point(0,0),
  // position has special behavior
  renderable:false,
  rotation:0,
  scale: new PIXI.Point(1,1),
  // can't set stage
  visible:true
  // can't set worldAlpha
  // can't set worldVisible
  // x has special behavior
  // y has special behavior
};

var gPIXIHandlers = [
  'click',
  'mousedown',
  'mouseout',
  'mouseover',
  'mouseup',
  'mouseupoutside',
  'tap',
  'touchstart',
  'touchend',
  'touchendoutside'
];

var DisplayObjectMixin = {

  construct: function(element) {
    this._currentElement = element;
    this._displayObject = null;
  },

  getPublicInstance: function() {
    return this._displayObject;
  },

  // Any props listed in propnames are applied to the display object
  transferDisplayObjectPropsByName: function(oldProps, newProps, propsToCheck) {
    var displayObject = this._displayObject;
    for (var propname in propsToCheck) {
      if (typeof newProps[propname] !== 'undefined') {
        displayObject[propname] = newProps[propname];
      } else if (typeof oldProps[propname] !== 'undefined' &&
                typeof propsToCheck[propname] !== 'undefined') {
        // the field we use previously but not any more. reset it to
        // some default value (unless the default is undefined)
        displayObject[propname] = propsToCheck[propname];
      }
    }
  },

  applyDisplayObjectProps: function(oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps, gStandardProps);

    var displayObject = this._displayObject;

    // Position can be specified using either 'position' or separate
    // x/y fields. If neither of these is specified we set them to 0
    if (typeof newProps.position !== 'undefined') {
      displayObject.position = newProps.position;
    } else {
      if (typeof newProps.x !== 'undefined') {
        displayObject.x = newProps.x;
      } else {
        displayObject.x = 0;
      }
      if (typeof newProps.y !== 'undefined') {
        displayObject.y = newProps.y;
      } else {
        displayObject.y = 0;
      }
    }

    // hook up event callbacks
    gPIXIHandlers.forEach(function (pixieventtype) {
      if (typeof newProps[pixieventtype] !== 'undefined') {
        displayObject[pixieventtype] = newProps[pixieventtype];
      } else {
        delete displayObject[pixieventtype];
      }
    });
  },

  mountComponentIntoNode: function() {
    throw new Error(
      'You cannot render a pixi.js component standalone. ' +
      'You need to wrap it in a PIXIStage component.'
    );
  }

};

//
// The DisplayObjectContainer is the basic Node/Container element of pixi.js
// It's basically a DisplayObject that can contain children.
//

var DisplayObjectContainerMixin = assign({}, DisplayObjectMixin, ReactMultiChild.Mixin, {

  moveChild: function(child, toIndex) {
    var childDisplayObject = child._mountImage; // should be a pixi display object

    // addChildAt automatically removes the child from it's previous location
    this._displayObject.addChildAt(childDisplayObject, toIndex);
  },

  createChild: function(child, childDisplayObject) {
    child._mountImage = childDisplayObject;
    this._displayObject.addChild(childDisplayObject);
    if (child.customDidAttach) {
      child.customDidAttach(childDisplayObject);
    }
  },

  removeChild: function(child) {
    var childDisplayObject = child._mountImage;
    if (child.customWillDetach) {
      child.customWillDetach(childDisplayObject);
    }

    this._displayObject.removeChild(childDisplayObject);
    child._mountImage = null;
  },

  /**
   * Override to bypass batch updating because it is not necessary.
   *
   * @param {?object} nextChildren.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @override {ReactMultiChild.Mixin.updateChildren}
   */
  updateChildren: function(nextChildren, transaction, context) {
    this._updateChildren(nextChildren, transaction, context);
  },

  // called by any container component after it gets mounted

  mountAndAddChildren: function(children, transaction, context) {
    var mountedImages = this.mountChildren(
      children,
      transaction,
      context
    );
    // Each mount image corresponds to one of the flattened children
    var i = 0;
    for (var key in this._renderedChildren) {
      if (this._renderedChildren.hasOwnProperty(key)) {
        var child = this._renderedChildren[key];
	DisplayObjectContainerMixin.createChild.call(this, child, mountedImages[i]);
        i++;
      }
    }
  },

  updateChildrenAtRoot: function(nextChildren, transaction) {
    this.updateChildren(nextChildren, transaction, emptyObject);
  },

  mountAndAddChildrenAtRoot: function(children, transaction) {
    this.mountAndAddChildren(children, transaction, emptyObject);
  }

});


//
// The 'Stage' component includes both the pixi.js stage and
// the canvas DOM element that pixi renders onto.
//
// Maybe split these into two components? Putting a DOM node and a pixi DisplayObject into
// the same component seems a little messy, but splitting them means you would always
// have to declare a stage component inside a pixi canvas. If there was a situation where
// you would want to 'swap out' one stage for another I suppose we could make a case for it...
// --GJH
//

var PIXIStage = React.createClass({
  displayName: 'PIXIStage',
  mixins: [DisplayObjectContainerMixin],

  setApprovedDOMProperties: function(nextProps) {
    var prevProps = this.props;

    var prevPropsSubset = {
      accesskey: prevProps.accesskey,
      className: prevProps.className,
      draggable: prevProps.draggable,
      role: prevProps.role,
      style: prevProps.style,
      tabindex: prevProps.tabindex,
      title: prevProps.title
    };

    var nextPropsSubset = {
      accesskey: nextProps.accesskey,
      className: nextProps.className,
      draggable: nextProps.draggable,
      role: nextProps.role,
      style: nextProps.style,
      tabindex: nextProps.tabindex,
      title: nextProps.title
    };

    this.props = nextPropsSubset;
    this._updateDOMProperties(prevPropsSubset);

    // Reset to normal state
    this.props = prevProps;
  },

  componentDidMount: function() {
    var props = this.props;
    var renderelement = this.getDOMNode();

    var backgroundcolor = (typeof props.backgroundcolor === "number") ? props.backgroundcolor : 0x66ff99;
    this._displayObject = new PIXI.Container();
    this._pixirenderer = PIXI.autoDetectRenderer(props.width, props.height, {view:renderelement, backgroundColor: props.backgroundcolor});

    //this.setApprovedDOMProperties(props);
    DisplayObjectMixin.applyDisplayObjectProps.call(this,{},props);

    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.mountAndAddChildrenAtRoot,
      this,
      props.children,
      transaction
    );
    ReactUpdates.ReactReconcileTransaction.release(transaction);
    this.renderStage();

    var that = this;
    that._rAFID = window.requestAnimationFrame( rapidrender );

    function rapidrender(timestamp) {

        that._timestamp = timestamp;
        that._rAFID = window.requestAnimationFrame( rapidrender );

        // render the stage
        that.renderStage();
    }
  },

  componentDidUpdate: function(oldProps) {
    var newProps = this.props;
     
    if (newProps.width != oldProps.width || newProps.height != oldProps.height) {
      this._pixirenderer.resize(+newProps.width, +newProps.height);
    }

    if (typeof newProps.backgroundcolor === "number") {
      this._pixirenderer.backgroundColor = newProps.backgroundcolor;
    }

    //this.setApprovedDOMProperties(newProps);
    DisplayObjectMixin.applyDisplayObjectProps.call(this, oldProps, newProps);

    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.updateChildrenAtRoot,
      this,
      this.props.children,
      transaction
    );
    ReactUpdates.ReactReconcileTransaction.release(transaction);

    this.renderStage();
  },

  componentWillUnmount: function() {
    this.unmountChildren();
    if (typeof this._rAFID !== 'undefined') {
      window.cancelAnimationFrame(this._rAFID);
    }
  },

  renderStage: function() {
    this._pixirenderer.render(this._displayObject);
  },

  render: function() {
    // the PIXI renderer will get applied to this canvas element
    return React.createElement("canvas");
  }

});

//
// If you're making something that inherits from DisplayObjectContainer,
// mixin these methods and implement your own version of
// createDisplayObject and applySpecificDisplayObjectProps
//

var CommonDisplayObjectContainerImplementation = {
  mountComponent: function(rootID, transaction, context) {
    /* jshint unused: vars */
    var props = this._currentElement.props;
    this._displayObject = this.createDisplayObject(arguments);
    this.applyDisplayObjectProps({}, props);
    this.applySpecificDisplayObjectProps({}, props);

    this.mountAndAddChildren(props.children, transaction, context);
    return this._displayObject;
  },

  receiveComponent: function(nextElement, transaction, context) {
    var newProps = nextElement.props;
    var oldProps = this._currentElement.props;

    this.applyDisplayObjectProps(oldProps, newProps);
    this.applySpecificDisplayObjectProps(oldProps, newProps);

    this.updateChildren(newProps.children, transaction, context);
    this._currentElement = nextElement;
  },

  unmountComponent: function() {
    this.unmountChildren();
  },

  mountComponentIntoNode: function(rootID, container) {
    /* jshint unused: vars */
    throw new Error(
      'You cannot render a PIXI object standalone, ' +
	' You need to wrap it in a PIXIStage.'
    );
  }

};



var DisplayObjectContainer = createPIXIComponent(
  'DisplayObjectContainer',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation, {

  createDisplayObject : function() {
    return new PIXI.Container();
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    // don't know if anyone actually sets the width/height manually on a DoC,
    // but it's here if they need it
    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'width':undefined,
        'height':undefined
      });
  }
});

//
// Sprite
//

var SpriteComponentMixin = {
  createDisplayObject : function () {
    var spriteimage = this._currentElement.props.image;
    return new PIXI.Sprite(PIXI.Texture.fromImage(spriteimage));
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'anchor':new PIXI.Point(0,0),
        'tint':0xFFFFFF,
        'blendMode':PIXI.BLEND_MODES.NORMAL,
        'shader':null,
        'texture':null // may get overridden by 'image' prop
      });

    var displayObject = this._displayObject;

    // support setting image by name instead of a raw texture ref
    if ((typeof newProps.image !== 'undefined') && newProps.image !== oldProps.image) {
      displayObject.texture = PIXI.Texture.fromImage(newProps.image);
    }
  }
};

var Sprite = createPIXIComponent(
  'Sprite',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  SpriteComponentMixin );

//
// SpriteBatch
//


var SpriteBatch = createPIXIComponent(
  'SpriteBatch',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation, {

  createDisplayObject : function() {
    return new PIXI.SpriteBatch();
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    // don't know if anyone actually sets the width/height manually on a DoC,
    // but it's here if they need it
    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'width':undefined,
        'height':undefined
      });
  }
});

//
// TilingSprite
//

var TilingSpriteComponentMixin = {

  createDisplayObject : function () {
    var props = this._currentElement.props;
    return new PIXI.extras.TilingSprite(PIXI.Texture.fromImage(props.image), props.width, props.height);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'tileScale': new PIXI.Point(1,1),
        'tilePosition' : new PIXI.Point(0,0),
        'tileScaleOffset' : new PIXI.Point(1,1)
      });

    // also modify values that apply to Sprite
    SpriteComponentMixin.applySpecificDisplayObjectProps.apply(this,arguments);
  }

};

var TilingSprite = createPIXIComponent(
  'TilingSprite',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  TilingSpriteComponentMixin );

//
// Text
//

var TextComponentMixin = {

  createDisplayObject: function() {
    var props = this._currentElement.props;

    var text = props.text || '';
    var style = props.style || {};
    return new PIXI.Text(text, style);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    // can't just copy over text props, we have to set the values via methods

    var displayObject = this._displayObject;

    if (typeof newProps.text !== 'undefined' && newProps.text !== oldProps.text) {
      displayObject.text = newProps.text;
    }
    // should do a deep compare here
    if (typeof newProps.style !== 'undefined' && newProps.style !== oldProps.style) {
      displayObject.style = newProps.style;
    }

    SpriteComponentMixin.applySpecificDisplayObjectProps.apply(this,arguments);
  }
};

// the linter (jshint) doesn't like the shadowing of 'Text' here but it's OK since
// we're in a commonjs module

// jshint -W079
var Text = createPIXIComponent(
  'Text',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  TextComponentMixin );
// jshint +W079

//
// BitmapText
//

var BitmapTextComponentMixin = {
  createDisplayObject: function () {
    var props = this._currentElement.props;

    var text = props.text || '';
    var style = props.style || {};
    return new PIXI.BitmapText(text,style);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    var displayObject = this._displayObject;

    if (typeof newProps.text !== 'undefined' && newProps.text !== oldProps.text) {
      displayObject.text = newProps.text;
    }
    // should do a deep compare here
    if (typeof newProps.style !== 'undefined' && newProps.style !== oldProps.style) {
      displayObject.style = newProps.style;
    }

    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'textWidth':undefined,
        'textHeight':undefined
      });

    SpriteComponentMixin.applySpecificDisplayObjectProps.apply(this,arguments);
  }
};

var BitmapText = createPIXIComponent(
  'BitmapText',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  BitmapTextComponentMixin );

//
// The "Custom DisplayObject" allows for user-specified object
// construction and applying properties
//

var CustomDisplayObjectImplementation = {
  mountComponent: function(rootID, transaction, context) {

    var props = this._currentElement.props;
    invariant(this.customDisplayObject, "No customDisplayObject method found for a CustomPIXIComponent");
    this._displayObject = this.customDisplayObject(props);

    this.applyDisplayObjectProps({}, props);
    if (this.customApplyProps) {
      this.customApplyProps(this._displayObject, {}, props);
    }

    this.mountAndAddChildren(props.children, transaction, context);

    return this._displayObject;
  },

  receiveComponent: function(nextElement, transaction, context) {
    var newProps = nextElement.props;
    var oldProps = this._currentElement.props;

    if (this.customApplyProps) {
      this.customApplyProps(this._displayObject, oldProps, newProps);
    }
    else {
      this.applyDisplayObjectProps(oldProps, newProps);
    }

    this.updateChildren(newProps.children, transaction, context);
    this._currentElement = nextElement;
  },

  // customDidAttach and customWillDetach are invoked by DisplayObjectContainerMixin,
  // which is where the attach/detach actually occurs

  unmountComponent: function() {
    this.unmountChildren();
  }
};

// functions required for a custom components:
//
// -customDisplayObject(props) to create a new display objects
//
// -customDidAttach(displayObject) to do stuff after attaching (attaching happens AFTER mounting)
//
// -customApplyProps(displayObject, oldProps, newProps) to apply custom props to your component;
//           note this disables the normal transfer of props to the displayObject; call
//           this.applyDisplayObjectProps(oldProps,newProps) in your custom method if you want that
//
// -customWillDetach(displayObject) to cleanup anything before detaching (detach happens BEFORE unmounting)

var CustomPIXIComponent = function (custommixin) {
  return createPIXIComponent(
    'CustomDisplayObject',
    DisplayObjectContainerMixin,
    CustomDisplayObjectImplementation,
    custommixin);
};


var PIXIComponents = {
  Stage : PIXIStage,
  DisplayObjectContainer : DisplayObjectContainer,
  SpriteBatch : SpriteBatch,
  Sprite : Sprite,
  Text : Text,
  BitmapText : BitmapText,
  TilingSprite : TilingSprite
};

var PIXIFactories = {};
for (var prop in PIXIComponents) {
    if (PIXIComponents.hasOwnProperty(prop)) {
      var component = PIXIComponents[prop];
      PIXIFactories[prop] = ReactElement.createFactory(component);
    }
}

module.exports =  assign(PIXIComponents, {
  factories: PIXIFactories,
  CustomPIXIComponent : CustomPIXIComponent
});
