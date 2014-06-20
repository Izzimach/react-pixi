
/*
 * Copyright (c) 2014 Gary Haussmann
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

//var React = require('react/react.js');

var DOMPropertyOperations = require('react/lib/DOMPropertyOperations');
var ReactComponent = require('react/lib/ReactComponent');
//var ReactMount = require('react/lib/ReactMount');
var ReactMultiChild = require('react/lib/ReactMultiChild');
var ReactBrowserComponentMixin = require('react/lib/ReactBrowserComponentMixin');
var ReactDOMComponent = require('react/lib/ReactDOMComponent');
var ReactComponentMixin = ReactComponent.Mixin;

var mixInto = require('react/lib/mixInto');
var merge = require('react/lib/merge');

//
// Generates a React component by combining several mixin components
//

function definePIXIComponent(name) {

  var ReactPIXIComponent = function() {};
  ReactPIXIComponent.displayName = name;
  ReactPIXIComponent.prototype.type = ReactPIXIComponent;

  for (var i = 1; i < arguments.length; i++) {
    mixInto(ReactPIXIComponent, arguments[i]);
  }

  var ConvenienceConstructor = function() {
    var instance = new ReactPIXIComponent();

    // Children can be either an array or more than one argument
    instance.construct.apply(instance, arguments);
    return instance;
  };
  ConvenienceConstructor.type = ReactPIXIComponent;
  return ConvenienceConstructor;
}

//
// A DisplayObject has x/y/scale properties
//

var PIXIHandlers = [
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

var DisplayObjectMixin = merge(ReactComponentMixin, {

  applyDisplayObjectProps: function(oldProps, props) {
    var displayObject = this.displayObject;

    var x = props.x || 0;
    var y = props.y || 0;
    var rotation = props.rotation || 0;

    displayObject.x = x;
    displayObject.y = y;
    displayObject.rotation = rotation;
    if (typeof props.visible !== 'undefined') {
      displayObject.visible = props.visible;
    }

    var scaletype = typeof props.scale;
    if (scaletype === "number") {
      // if scale is a number, set both X and Y values
      displayObject.scale.x = props.scale;
      displayObject.scale.y = props.scale;
    } else if (scaletype === "object") {
      // copy over scale values
      var scale = props.scale !== null ? props.scale : 1;
      displayObject.scale.x = scale.x;
      displayObject.scale.y = scale.y;
    } else {
      displayObject.scale.x = 1;
      displayObject.scale.y = 1;
    }

    // interactivity and event processing
    displayObject.interactive = typeof props.interactive !== 'undefined' ? props.interactive : false;

    // hook up event callbacks
    PIXIHandlers.forEach(function (pixieventtype) {
      if (typeof props[pixieventtype] !== 'undefined') {
        displayObject[pixieventtype] = props[pixieventtype];
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

});

//
// The DisplayObjectContainer is the basic Node/Container element of pixi.js
// It's basically a DisplayObject that can contain children.
//

var DisplayObjectContainerMixin = merge(merge(DisplayObjectMixin, ReactMultiChild.Mixin), {

  moveChild: function(child, toIndex) {
    var childDisplayObject = child._mountImage; // should be a pixi display object

    // addChildAt automatically removes the child from it's previous location
    this.displayObject.addChildAt(childDisplayObject, toIndex);
  },

  createChild: function(child, childDisplayObject) {
    child._mountImage = childDisplayObject;
    this.displayObject.addChild(childDisplayObject);
  },

  removeChild: function(child) {
    var childDisplayObject = child._mountImage;

    this.displayObject.removeChild(childDisplayObject);
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
  updateChildren: function(nextChildren, transaction) {
    this._updateChildren(nextChildren, transaction);
  },

  // called by any container component after it gets mounted

  mountAndAddChildren: function(children, transaction) {
    var mountedImages = this.mountChildren(
      children,
      transaction
    );
    // Each mount image corresponds to one of the flattened children
    var i = 0;
    for (var key in this._renderedChildren) {
      if (this._renderedChildren.hasOwnProperty(key)) {
        var child = this._renderedChildren[key];
        child._mountImage = mountedImages[i];
        this.displayObject.addChild(child._mountImage);
        i++;
      }
    }
  }

});

//
// Normally DisplayObject barfs if you try to mount a DOM node, since DisplayObjects
// represent pixi.js entities and not DOM nodes.
//
// However, the Stage is a DisplayObjectContainer that also mounts a DOM node (the canvas)
// so we have to override the error detecting method present in DisplayObject
//
// Seems a bit hackish. We could split the PIXIStage into a Stage and a separate canvas component?
//
var StageMixin = merge(DisplayObjectContainerMixin, {
  mountComponentIntoNode : ReactComponent.Mixin.mountComponentIntoNode
});


//
// The 'Stage' component includes both7 the pixi.js stage and
// the canvas DOM element that pixi renders onto.
//
// Maybe split these into two components? Putting a DOM node and a pixi DisplayObject into
// the same component seems a little messy, but splitting them means you would always
// have to declare a stage component inside a pixi canvas. If there was a situation where
// you would want to 'swap out' one stage for another I suppose we could make a case for it...
// --GJH
//

var PIXIStage = definePIXIComponent(
  'PIXIStage',
  ReactBrowserComponentMixin,
  ReactDOMComponent.Mixin,
  ReactComponentMixin,
  StageMixin, {

  mountComponent: function(rootID, transaction, mountDepth) {
    ReactComponentMixin.mountComponent.call(
      this,
      rootID,
      transaction,
      mountDepth
    );
    transaction.getReactMountReady().enqueue(this, this.componentDidMount);
    // Temporary placeholder
    var idMarkup = DOMPropertyOperations.createMarkupForID(rootID);
    return '<canvas ' + idMarkup + '></canvas>';
  },

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
    this.displayObject = new PIXI.Stage(backgroundcolor);
    this.pixirenderer = PIXI.autoDetectRenderer(props.width, props.height, renderelement);

    this.setApprovedDOMProperties(props);
    this.applyDisplayObjectProps({},this.props);

    var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.mountAndAddChildren,
      this,
      props.children,
      transaction
    );
    ReactComponent.ReactReconcileTransaction.release(transaction);
    this.renderStage();

    var that = this;
    that._rAFID = window.requestAnimFrame( rapidrender );

    function rapidrender(timestamp) {

        that._timestamp = timestamp;
        that._rAFID = window.requestAnimationFrame( rapidrender );

        // render the stage
        that.renderStage();
    }

    this.props = props;
  },

  receiveComponent: function(nextComponent, transaction) {
    var props = nextComponent.props;

    if (this.props.width != props.width || this.props.width != props.height) {
      this.pixirenderer.resize(+props.width, +props.height);
    }

    this.setApprovedDOMProperties(props);
    this.applyDisplayObjectProps(this.props, props);

    this.updateChildren(props.children, transaction);
    this.renderStage();

    this.props = props;
  },

  unmountComponent: function() {
    ReactComponentMixin.unmountComponent.call(this);
    if (typeof this._rAFID !== 'undefined') {
      window.cancelAnimationFrame(this._rAFID);
    }
    this.unmountChildren();
  },

  renderStage: function() {
    this.pixirenderer.render(this.displayObject);
  }

});

//
// If you're making something that inherits from DisplayObjectContainer,
// mixin these methods and implement your own version of
// createDisplayObject and applySpecificDisplayObjectProps
//

var CommonDisplayObjectContainerImplementation = {

  mountComponent: function(transaction) {
    ReactComponentMixin.mountComponent.apply(this, arguments);
    this.displayObject = this.createDisplayObject(arguments);
    this.applyDisplayObjectProps({}, this.props);
    this.applySpecificDisplayObjectProps({}, this.props);

    this.mountAndAddChildren(this.props.children, transaction);
    return this.displayObject;
  },

  receiveComponent: function(nextComponent, transaction) {
    var props = nextComponent.props;
    this.applyDisplayObjectProps(this.props, props);
    this.applySpecificDisplayObjectProps(this.props, props);

    this.updateChildren(props.children, transaction);
    this.props = props;
  },

  unmountComponent: function() {
    this.unmountChildren();
  }

};



var DisplayObjectContainer = definePIXIComponent(
  'DisplayObjectContainer',
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation, {

  createDisplayObject : function() {
    return new PIXI.DisplayObjectContainer();
  },

  applySpecificDisplayObjectProps: function () {
    // nothing specific for DisplayObjectContainer
  }
});

//
// Sprite
//

var SpriteComponentMixin = {
  createDisplayObject : function () {
    var spriteimage = this.props.image;
    return new PIXI.Sprite(PIXI.Texture.fromImage(spriteimage));
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    var displayObject = this.displayObject;

    if ((typeof newProps.image !== 'undefined') && newProps.image !== oldProps.image) {
      displayObject.setTexture(PIXI.Texture.fromImage(newProps.image));
    }

    if (typeof newProps.anchor !== 'undefined') {
      displayObject.anchor.x = newProps.anchor.x;
      displayObject.anchor.y = newProps.anchor.y;
    }

    if (typeof newProps.tint !== 'undefined') {
      displayObject.tint = newProps.tint;
    }

    if (typeof newProps.blendMode !== 'undefined') {
      this.displayObject.blendMode = newProps.blendMode;
    }
  }
};

var Sprite = definePIXIComponent(
  'Sprite',
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  SpriteComponentMixin );

//
// TilingSprite
//

var TilingSpriteComponentMixin = {

  createDisplayObject : function () {
    var spriteimage = this.props.image;
    return new PIXI.TilingSprite(PIXI.Texture.fromImage(spriteimage), this.props.width, this.props.height);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    var displayObject = this.displayObject;

    if (typeof newProps.tileScale !== 'undefined') {
      displayObject.tileScale.x = newProps.tileScale.x;
      displayObject.tileScale.y = newProps.tileScale.y;
    }
    if (typeof newProps.tilePosition !== 'undefined') {
      displayObject.tilePosition.x = newProps.tilePosition.x;
      displayObject.tilePosition.y = newProps.tilePosition.y;
    }
    if (typeof newProps.tileScaleOffset !== 'undefined') {
      displayObject.tileScaleOffset.x = newProps.tileScaleOffset.x;
      displayObject.tileScaleOffset.y = newProps.tileScaleOffset.y;
    }

    // also modify values that apply to Sprite
    SpriteComponentMixin.applySpecificDisplayObjectProps.apply(this,arguments);
  }

};

var TilingSprite = definePIXIComponent(
  'TilingSprite',
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  TilingSpriteComponentMixin );

//
// Text
//

var TextComponentMixin = {

  createDisplayObject: function() {
    var text = this.props.text || '';
    var style = this.props.style || {};
    return new PIXI.Text(text, style);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    var displayObject = this.displayObject;

    if (typeof newProps.text !== 'undefined' && newProps.text !== oldProps.text) {
      displayObject.setText(newProps.text);
    }
    // should do a deep compare here
    if (typeof newProps.style !== 'undefined' && newProps.style !== oldProps.style) {
      displayObject.setStyle(newProps.style);
    }

    SpriteComponentMixin.applySpecificDisplayObjectProps.apply(this,arguments);
  }
};

var Text = definePIXIComponent(
  'Text',
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  TextComponentMixin );

//
// BitmapText
//

var BitmapTextComponentMixin = {
  createDisplayObject: function () {
    var text = this.props.text || '';
    var style = this.props.style || {};
    return new PIXI.BitmapText(text,style);
  },

  applySpecificDisplayObjectProps: function (oldProps, newProps) {
    var displayObject = this.displayObject;

        if (typeof newProps.text !== 'undefined' && newProps.text !== oldProps.text) {
      displayObject.setText(newProps.text);
    }
    // should do a deep compare here
    if (typeof newProps.style !== 'undefined' && newProps.style !== oldProps.style) {
      displayObject.setStyle(newProps.style);
    }
    if (typeof newProps.textWidth !== 'undefined') {
      displayObject.textWidth = newProps.textWidth;
    }
    if (typeof newProps.textHeight !== 'undefined') {
      displayObject.textHeight = newProps.textHeight;
    }
    SpriteComponentMixin.applySpecificDisplayObjectProps.apply(this,arguments);
  }
};

var BitmapText = definePIXIComponent(
  'BitmapText',
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  BitmapTextComponentMixin );

//
// The "Custom DisplayObject" allows for user-specified object
// construction and applying properties
//

var CustomDisplayObjectContainerImplementation = {
  mountComponent: function(transaction) {
    ReactComponentMixin.mountComponent.apply(this, arguments);
    this.displayObject = this.customDisplayObject(arguments);
    this.applyCustomProps({}, this.props);

    this.mountAndAddChildren(this.props.children, transaction);
    return this.displayObject;
  },

  receiveComponent: function(nextComponent, transaction) {
    var props = nextComponent.props;
    this.applyCustomProps(this.props, props);

    this.updateChildren(props.children, transaction);
    this.props = props;
  },

  unmountComponent: function() {
    this.unmountChildren();
  }
};

var CustomPIXIComponent = function (custommixin) {
  return definePIXIComponent(
    'CustomDisplayObject',
    ReactComponentMixin,
    DisplayObjectContainerMixin,
    CustomDisplayObjectContainerImplementation,
    custommixin);
};

// module data

module.exports =  {
  Stage : PIXIStage,
  DisplayObjectContainer : DisplayObjectContainer,
  Sprite: Sprite,
  Text: Text,
  BitmapText : BitmapText,
  TilingSprite: TilingSprite,
  CreateCustomPIXIComponent : CustomPIXIComponent
};
