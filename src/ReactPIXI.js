
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

import React from 'react';
import ReactDOM from 'react-dom';
import * as PIXI from 'pixi.js';

import ReactMultiChild from 'react-dom/lib/ReactMultiChild';
import ReactElement from 'react/lib/ReactElement';
import ReactUpdates from 'react-dom/lib/ReactUpdates';
import ReactInjection from 'react-dom/lib/ReactInjection';

import assign from 'object-assign';
import emptyObject from 'fbjs/lib/emptyObject';
import warning from 'fbjs/lib/warning';

import monkeypatch from './ReactPIXIMonkeyPatch';
monkeypatch();

//
// Generates a React component by combining several mixin components
//

function createPIXIComponent(name, ...mixins) {

  let ReactPIXIComponent = function(element) {
    /* jshint unused: vars */
    this.node = null;
    this._mountImage = null;
    this._renderedChildren = null;
    this._displayObject = null;
    this._currentElement = element;
    this._nativeParent = null;
    this._nativeContainerInfo = null;
    this.getHostNode = function() { return this._displayobject; }
  };
  ReactPIXIComponent.displayName = name;
  for (var m of mixins) {
    assign(ReactPIXIComponent.prototype, m);
  }

  return ReactPIXIComponent;
}

//
// Parse a value as a PIXI.Point.
//

function parsePoint(val) {
  var arr;
  if (typeof val === 'string') {
    arr = val.split(',').map(Number) ;
  }
  else if (typeof val === 'number') {
    arr = [val];
  }
  else if (Array.isArray(val)) {
    // shallow copy the array
    arr = val.slice();
  }
  else if ("x" in val) {
    arr = [val.x, val.y];
  }

  return arr;
}

function isPointType(v) {
  return ((v instanceof PIXI.Point) || (v instanceof PIXI.ObservablePoint));
}

//
// Set props on a DisplayObject by checking the type. If a PIXI.Point or
// a PIXI.ObservablePoint is having its value set, then either a comma-separated
// string with in the form of "x,y" or a size 2 array with index 0 being the x
// coordinate and index 1 being the y coordinate.
//

function setPixiValue(container, key, value) {
  // Just copy the data if a Point type is being assigned to a Point type
  if (isPointType(container[key]) && isPointType(value)) {
    container[key].copy(value);
  }
  else if (isPointType(container[key])) {
    var coordinateData = parsePoint(value);

    if ((typeof coordinateData === 'undefined') ||
        (coordinateData.length < 1) ||
        (coordinateData.length > 2))
    {
      throw new Error(
          `The property '${key}' is a PIXI.Point or PIXI.ObservablePoint and ` +
          'must be set to a comma-separated string of either 1 or 2 ' +
          'coordinates, a 1 or 2 element array containing coordinates, or a ' +
          'PIXI Point/ObservablePoint. If only one coordinate is ' +
          'given then X and Y will be set to the provided value.');
    }

    container[key].set(coordinateData.shift(), coordinateData.shift());
  }
  else {
    container[key] = value;
  }
}


//
// A DisplayObject has some standard properties and default values
//

var gStandardProps = {
  alpha:1,
  buttonMode:false,
  cacheAsBitmap:null,
  defaultCursor:'pointer',
  filterArea:null,
  filters:null,
  hitArea:null,
  interactive:false,
  mask:null,
  // can't set parent!
  pivot:0,
  // position has special behavior
  renderable:false,
  rotation:0,
  scale:1,
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
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'mouseupoutside',
  'tap',
  'touchstart',
  'touchmove',
  'touchend',
  'touchendoutside'
];


var DisplayObjectMixin = {

  construct(element) {
    this._currentElement = element;
    this._displayObject = null;
    this._nativeParent = null;
    this._nativeContainerInfo = null;
  },

  getPublicInstance() {
    return this._displayObject;
  },

  // Any props listed in propnames are applied to the display object
  transferDisplayObjectPropsByName(oldProps, newProps, propsToCheck) {
    let displayObject = this._displayObject;
    for (var propname in propsToCheck) {
      if (typeof newProps[propname] !== 'undefined') {
        setPixiValue(displayObject, propname, newProps[propname]);
      } else if (typeof oldProps[propname] !== 'undefined' &&
                typeof propsToCheck[propname] !== 'undefined') {
        // the field we use previously but not any more. reset it to
        // some default value (unless the default is undefined)
        setPixiValue(displayObject, propname, propsToCheck[propname]);
      }
    }
  },

  applyDisplayObjectProps(oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps, gStandardProps);

    let displayObject = this._displayObject;

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

  mountComponentIntoNode() {
    throw new Error(
      'You cannot render a pixi.js component standalone. ' +
      'You need to wrap it in a PIXIStage component.'
    );
  },

  getNativeNode() {
    return this._displayObject;
  },

};

//
// The DisplayObjectContainer is the basic Node/Container element of pixi.js
// It's basically a DisplayObject that can contain children.
//

var DisplayObjectContainerMixin = assign({}, DisplayObjectMixin, ReactMultiChild.Mixin, {

  moveChild: function(prevChild, lastPlacedNode, nextIndex, lastIndex) {
    let childDisplayObject = prevChild._mountImage;
    let thisObject = this._mountImage || this._displayObject;

    // addChildAt automatically removes the child from it's previous location
    thisObject.addChildAt(childDisplayObject, nextIndex);
  },

  createChild: function(child, afterNode, childDisplayObject) {
    child._mountImage = childDisplayObject;
    this.getNativeNode().addChild(childDisplayObject);
    if (child.customDidAttach) {
      child.customDidAttach(childDisplayObject);
    }
  },

  removeChild: function(child, node) {
    let childDisplayObject = child._mountImage;
    if (child.customWillDetach) {
      child.customWillDetach(childDisplayObject);
    }

    this.getNativeNode().removeChild(childDisplayObject);
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
    let i = 0;
    let rootObject = this.getNativeNode();
    let prevNode = null;
    for (var key in this._renderedChildren) {
      if (this._renderedChildren.hasOwnProperty(key)) {
        var child = this._renderedChildren[key];
        child._mountImage = mountedImages[i];
	DisplayObjectContainerMixin.createChild.call(this, child, prevNode, mountedImages[i]);
        prevNode = child._mountImage;
        i++;
      }
    }
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

  generateDefaultRenderer: function(props) {
    // standard canvas/webGL renderer
    const renderelement = ReactDOM.findDOMNode(this);

    let backgroundColor = (typeof props.backgroundColor === "number") ? props.backgroundColor : 0x66ff99;
    // check for old-style capitalization (or lack of for backgroundColor)
    if (typeof props.backgroundcolor !== 'undefined')
    {
      warning(false, "Using lowercase on Stage prop backgroundcolor is deprecated - use backgroundColor instead");
      backgroundColor = props.backgroundcolor;
    }
    const resolution = (typeof props.resolution === "number") ? props.resolution : 1;
    const antialias = props.antialias ? props.antialias : false;
    const transparent = props.transparent ? props.transparent : false;
    const preserveDrawingBuffer = props.preserveDrawingBuffer ? props.preserveDrawingBuffer : false;

    this._pixirenderer = PIXI.autoDetectRenderer(props.width, props.height,
      {view:renderelement,
       backgroundColor: backgroundColor,
       antialias: props.antialias,
       transparent: transparent,
       resolution: props.resolution,
       preserveDrawingBuffer: preserveDrawingBuffer
      });
  },

  componentDidMount: function() {
    var props = this.props;
    if (typeof props.renderer === 'undefined') {
      this.generateDefaultRenderer(props);
    } else {
      // custom renderer
      this._pixirenderer = props.renderer;
    }

    var context = this._reactInternalInstance._context;
    this._displayObject = new PIXI.Container();
    //this.setApprovedDOMProperties(props);
    DisplayObjectMixin.applyDisplayObjectProps.call(this,{},props);


    // HACK - this behaves as both a composite component and a DisplayObjectContainer,
    // so it has to have the internal secret React variables of both types of nodes.
    // Thus some internals have to be copied from the internal instance to 'this'
    this._debugID = this._reactInternalInstance._debugID;
    this._hostContainerInfo = this._reactInternalInstance._hostContainerInfo;
    this._hostNode = this._reactInternalInstance._renderedComponent._hostNode

    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.mountAndAddChildren,
      this,
      props.children,
      transaction,
      context
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
    var context = this._reactInternalInstance._context;

    // maybe update renderer
    // have to handle 'undefined' renderer prop
    if (newProps.renderer !== oldProps.renderer ||
        typeof newProps.renderer !== typeof oldProps.renderer) {
      if (typeof newProps.renderer === 'undefined') {
        this.generateDefaultRenderer(newProps);
      } else {
        this._pixirenderer = newProps.renderer;
      }
    }

    if (newProps.width != oldProps.width || newProps.height != oldProps.height) {
      this._pixirenderer.resize(+newProps.width, +newProps.height);
    }

    if (typeof newProps.backgroundcolor === "number") {
      this._pixirenderer.backgroundColor = newProps.backgroundcolor;
    }
    else if (typeof newProps.backgroundColor === "number") {
      this._pixirenderer.backgroundColor = newProps.backgroundColor;
    }

    //this.setApprovedDOMProperties(newProps);
    DisplayObjectMixin.applyDisplayObjectProps.call(this, oldProps, newProps);

    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.updateChildren,
      this,
      this.props.children,
      transaction,
      context
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
    // the PIXI renderer will get applied to this canvas element unless there is a custom renderer
    if (typeof this.props.renderer === 'undefined') {
      if (typeof this.props.style === 'undefined') {
        // no style props, use a default canvas
        return React.createElement("canvas");
      }
      else
      {
        return React.createElement("canvas", {style: this.props.style});
      }
    } else {
      return null;
    }
  }

});

//
// If you're making something that inherits from DisplayObjectContainer,
// mixin these methods and implement your own version of
// createDisplayObject and applySpecificDisplayObjectProps
//

var CommonDisplayObjectContainerImplementation = {
  mountComponent: function(transaction, nativeParent, nativeContainerInfo, context) {
    /* jshint unused: vars */
    let props = this._currentElement.props;
    this._nativeParent = nativeParent;
    this._nativeContainerInfo = nativeContainerInfo;
    this._displayObject = this.createDisplayObject(arguments);
    this.applyDisplayObjectProps({}, props);
    this.applySpecificDisplayObjectProps({}, props);

    this.mountAndAddChildren(props.children, transaction, context);
    return this._displayObject;
  },

  receiveComponent: function(nextElement, transaction, context) {
    let newProps = nextElement.props;
    let oldProps = this._currentElement.props;

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
// Null object (used when render returns null)
//
var NullDisplayObject = createPIXIComponent(
  'EmptyDisplayObject',
  DisplayObjectContainer,
  CommonDisplayObjectContainerImplementation, {

    construct(element) {
      this._currentElement = element;
      this._displayObject = null;
      this._nativeParent = null;
      this._nativeContainerInfo = null;
    },

    getPublicInstance() {
      return this._displayObject;
    },

    mountComponent: function(transaction, nativeParent, nativeContainerInfo, context) {
      /* jshint unused: vars */
      this._nativeParent = nativeParent;
      this._nativeContainerInfo = nativeContainerInfo;
      this._displayObject = new PIXI.DisplayObject();
      this._displayObject.interactiveChildren = false;

      return this._displayObject;
    },

    receiveComponent: function(nextElement, transaction, context) {
      this._currentElement = nextElement;
    },

    unmountComponent: function() {
    },

    mountComponentIntoNode: function(rootID, container) {
      /* jshint unused: vars */
      throw new Error(
        'You cannot render a PIXI object standalone, ' +
  	' You need to wrap it in a PIXIStage.'
      );
    }
});




//
// Graphics
//

var Graphics = createPIXIComponent(
  'Graphics',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation, {

  createDisplayObject : function() {
  	return new PIXI.Graphics();
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps, {
      'width': undefined,
      'height': undefined
    });
  }
});

//
// Sprite
//

var SpriteComponentMixin = {
  createDisplayObject : function () {
    if (this._currentElement.props.image) {
      let spriteimage = this._currentElement.props.image;
      return new PIXI.Sprite(PIXI.Texture.fromImage(spriteimage));
    } else if (this._currentElement.props.texture) {
      let texture = this._currentElement.props.texture;
      warning(texture instanceof PIXI.Texture, "the Sprite 'texture' prop must be an instance of PIXI.Texture");
      return new PIXI.Sprite(texture);
    }
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'anchor':0,
        'tint':0xFFFFFF,
        'blendMode':PIXI.BLEND_MODES.NORMAL,
        'shader':null,
        'width':undefined,
        'height':undefined,
        'texture':null // may get overridden by 'image' prop
      });

    let displayObject = this._displayObject;

    // support setting image by name instead of a raw texture ref
    if ((typeof newProps.image !== 'undefined') && newProps.image !== oldProps.image) {
      displayObject.texture = PIXI.Texture.fromImage(newProps.image);
    } else if ((typeof newProps.texture !== 'undefined') && newProps.texture !== oldProps.texture) {
      warning(newProps.texture instanceof PIXI.Texture, "the Sprite 'texture' prop must be an instance of PIXI.Texture");
      displayObject.texture = newProps.texture;
    }
  }
};

var Sprite = createPIXIComponent(
  'Sprite',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  SpriteComponentMixin );

//
// ParticleContainer
//


var ParticleContainer = createPIXIComponent(
  'ParticleContainer',
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation, {

  createDisplayObject : function() {
    return new PIXI.particles.ParticleContainer();
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
    let props = this._currentElement.props;
    return new PIXI.extras.TilingSprite(PIXI.Texture.fromImage(props.image), props.width, props.height);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    this.transferDisplayObjectPropsByName(oldProps, newProps,
      {
        'tileScale' : 1,
        'tilePosition' : 0,
        'tileScaleOffset' : 1
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
    let props = this._currentElement.props;

    let text = props.text || '';
    let style = props.style || {};
    return new PIXI.Text(text, style);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    // can't just copy over text props, we have to set the values via methods

    let displayObject = this._displayObject;

    if (typeof newProps.text !== 'undefined' && newProps.text !== oldProps.text) {
      displayObject.text = newProps.text;
    }
    // should do a deep compare here
    if (typeof newProps.style !== 'undefined' && newProps.style !== oldProps.style) {
      displayObject.fontStyle = newProps.style;
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
    let props = this._currentElement.props;

    let text = props.text || '';
    let style = props.style || {};
    return new PIXI.extras.BitmapText(text,style);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    let displayObject = this._displayObject;

    if (typeof newProps.text !== 'undefined' && newProps.text !== oldProps.text) {
      displayObject.text = newProps.text;
    }
    // should do a deep compare here
    if (typeof newProps.style !== 'undefined' && newProps.style !== oldProps.style) {
      displayObject.style = newProps.style;
      if (typeof oldProps.style === 'undefined' || newProps.style.font !== oldProps.style.font) {
        let font = newProps.style.font.split(' ')
        displayObject.font.name = font[1]
        displayObject.font.size = parseInt(font[0], 10)
        displayObject.updateText()
      }
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

    let props = this._currentElement.props;
    warning(this.customDisplayObject, "No customDisplayObject method found for a CustomPIXIComponent");
    this._displayObject = this.customDisplayObject(props);

    this.applyDisplayObjectProps({}, props);
    if (this.customApplyProps) {
      this.customApplyProps(this._displayObject, {}, props);
    }

    this.mountAndAddChildren(props.children, transaction, context);

    return this._displayObject;
  },

  receiveComponent: function(nextElement, transaction, context) {
    let newProps = nextElement.props;
    let oldProps = this._currentElement.props;

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
  ParticleContainer : ParticleContainer,
  Sprite : Sprite,
  Text : Text,
  BitmapText : BitmapText,
  TilingSprite : TilingSprite,
  Graphics : Graphics
};

var PIXIFactories = {};
for (var prop in PIXIComponents) {
    if (PIXIComponents.hasOwnProperty(prop)) {
      let component = PIXIComponents[prop];
      PIXIFactories[prop] = ReactElement.createFactory(component);
    }
}

ReactInjection.EmptyComponent.injectEmptyComponentFactory(function (instanitate) {
  return new NullDisplayObject();
});


module.exports =  assign(PIXIComponents, {
  factories: PIXIFactories,
  CustomPIXIComponent : CustomPIXIComponent,
  render: ReactDOM.render,
  unmountComponentAtNode: ReactDOM.unmountComponentAtNode
});
