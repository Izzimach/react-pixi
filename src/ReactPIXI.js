
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

var React = require('react');

var DOMPropertyOperations = require('react/lib/DOMPropertyOperations');
var ReactComponent = require('react/lib/ReactComponent');
var ReactElement  = require('react/lib/ReactElement');
var ReactLegacyElement = require('react/lib/ReactLegacyElement');
var ReactUpdates = require('react/lib/ReactUpdates');
var ReactMultiChild = require('react/lib/ReactMultiChild');
var ReactBrowserComponentMixin = require('react/lib/ReactBrowserComponentMixin');
var ReactDOMComponent = require('react/lib/ReactDOMComponent');
var ReactComponentMixin = ReactComponent.Mixin;

var assign = require('react/lib/Object.assign');
var emptyObject = require('react/lib/emptyObject');
var warning = require('react/lib/warning');

var shouldUpdateReactComponent = require('react/lib/shouldUpdateReactComponent');
var instantiateReactComponent = require ('react/lib/instantiateReactComponent');
var invariant = require('react/lib/invariant');

var PIXI = require('pixi.js');

//
// Generates a React component by combining several mixin components
//

function createPIXIComponent(name) {

  var ReactPIXIComponent = function(props) {
    /* jshint unused: vars */
    this.node = null;
    this._mountImage = null;
    this._renderedChildren = null;
    this.displayObject = null;
  };
  ReactPIXIComponent.displayName = name;
  for (var i = 1; i < arguments.length; i++) {
    assign(ReactPIXIComponent.prototype, arguments[i]);
  }

  //return ReactPIXIComponent;
  return ReactLegacyElement.wrapFactory(
    ReactElement.createFactory(ReactPIXIComponent)
  );
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

var DisplayObjectMixin = assign({}, ReactComponentMixin, {

  // Any props listed in propnames are applied to the display object
  transferDisplayObjectPropsByName: function(oldProps, newProps, propsToCheck) {
    var displayObject = this.displayObject;
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

    var displayObject = this.displayObject;

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

});

//
// The DisplayObjectContainer is the basic Node/Container element of pixi.js
// It's basically a DisplayObject that can contain children.
//

var DisplayObjectContainerMixin = assign({}, DisplayObjectMixin, ReactMultiChild.Mixin, {

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
        child._mountImage = mountedImages[i];
        this.displayObject.addChild(child._mountImage);
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
// Normally DisplayObject barfs if you try to mount a DOM node, since DisplayObjects
// represent pixi.js entities and not DOM nodes.
//
// However, the Stage is a DisplayObjectContainer that also mounts a DOM node (the canvas)
// so we have to override the error detecting method present in DisplayObject
//
// Seems a bit hackish. We could split the PIXIStage into a Stage and a separate canvas component?
//
var StageMixin = assign({}, DisplayObjectContainerMixin, {
  mountComponentIntoNode : ReactComponent.Mixin.mountComponentIntoNode
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

var PIXIStage = createPIXIComponent(
  'PIXIStage',
  ReactBrowserComponentMixin,
  ReactDOMComponent.Mixin,
  ReactComponentMixin,
  StageMixin, {

  mountComponent: function(rootID, transaction, context) {
    /* jshint unused: vars */
    ReactComponentMixin.mountComponent.apply(this, arguments);
    transaction.getReactMountReady().enqueue(this.componentDidMount, this);
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
    this.pixirenderer = PIXI.autoDetectRecommendedRenderer(props.width, props.height, {view:renderelement});

    this.setApprovedDOMProperties(props);
    this.applyDisplayObjectProps({},props);

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

  receiveComponent: function(nextElement, transaction, context) {
    if (nextElement === this._currentElement &&
        nextElement._owner !== null) {
      return;
    }

    ReactComponent.Mixin.receiveComponent.call(this, nextElement, transaction, context);

    var newProps = nextElement.props;
    var oldProps = this._currentElement.props;

    if (newProps.width != oldProps.width || newProps.width != oldProps.height) {
      this.pixirenderer.resize(+newProps.width, +newProps.height);
    }

    if (typeof newProps.backgroundcolor === "number") {
      this.displayObject.setBackgroundColor(newProps.backgroundcolor);
    }

    this.setApprovedDOMProperties(newProps);
    this.applyDisplayObjectProps(oldProps, newProps);

    this.updateChildrenAtRoot(newProps.children, transaction);
    this.renderStage();

    this._currentElement = nextElement;
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
  mountComponent: function(rootID, transaction, context) {
    /* jshint unused: vars */
    ReactComponentMixin.mountComponent.apply(this, arguments);

    var props = this._currentElement.props;
    this.displayObject = this.createDisplayObject(arguments);
    this.applyDisplayObjectProps({}, props);
    this.applySpecificDisplayObjectProps({}, props);

    this.mountAndAddChildren(props.children, transaction, context);
    return this.displayObject;
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
  }

};



var DisplayObjectContainer = createPIXIComponent(
  'DisplayObjectContainer',
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation, {

  createDisplayObject : function() {
    return new PIXI.DisplayObjectContainer();
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
        'blendMode':PIXI.blendModes.NORMAL,
        'shader':null,
        'texture':null // may get overridden by 'image' prop
      });

    var displayObject = this.displayObject;

    // support setting image by name instead of a raw texture ref
    if ((typeof newProps.image !== 'undefined') && newProps.image !== oldProps.image) {
      displayObject.setTexture(PIXI.Texture.fromImage(newProps.image));
    }
  }
};

var Sprite = createPIXIComponent(
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
    var props = this._currentElement.props;
    return new PIXI.TilingSprite(PIXI.Texture.fromImage(props.image), props.width, props.height);
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
  ReactComponentMixin,
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

var Text = createPIXIComponent(
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
    var props = this._currentElement.props;

    var text = props.text || '';
    var style = props.style || {};
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
  ReactComponentMixin,
  DisplayObjectContainerMixin,
  CommonDisplayObjectContainerImplementation,
  BitmapTextComponentMixin );

//
// The "Custom DisplayObject" allows for user-specified object
// construction and applying properties
//

var CustomDisplayObjectImplementation = {
  mountComponent: function(rootID, transaction, context) {
    ReactComponentMixin.mountComponent.apply(this, arguments);

    var props = this._currentElement.props;
    this.displayObject = this.customDisplayObject(arguments);
    this.applyDisplayObjectProps({}, props);
    this.applyCustomProps({}, props);

    this.mountAndAddChildren(props.children, transaction, context);
    return this.displayObject;
  },

  receiveComponent: function(nextElement, transaction, context) {
    var newProps = nextElement.props;
    var oldProps = this._currentElement.props;

    this.applyDisplayObjectProps(oldProps, newProps);
    this.applyCustomProps(oldProps, newProps);

    this.updateChildren(newProps.children, transaction, context);
    this._currentElement = nextElement;
  },

  unmountComponent: function() {
    this.unmountChildren();
  }
};

var CustomPIXIComponent = function (custommixin) {
  return createPIXIComponent(
    'CustomDisplayObject',
    ReactComponentMixin,
    DisplayObjectContainerMixin,
    CustomDisplayObjectImplementation,
    custommixin);
};

//
// Composite components don't have a displayObject. So we have to do some work to find
// the proper displayObject sometimes.
//

function findDisplayObjectAncestor(componentinstance) {
  // walk up via _owner until we find something with a displayObject hasOwnProperty
  var componentwalker = componentinstance._currentElement._owner;
  while (typeof componentwalker !== 'undefined') {
    // no owner? then fail
    if (typeof componentwalker._renderedComponent.displayObject !== 'undefined') {
      return componentwalker._renderedComponent.displayObject;
    }
    componentwalker = componentwalker._currentElement._owner;
  }

  // we walked all the way up and found no displayObject
  return undefined;
}

function findDisplayObjectChild(componentinstance) {
  // walk downwards via _renderedComponent to find something with a displayObject
  var componentwalker = componentinstance;
  while (typeof componentwalker !== 'undefined') {
    // no displayObject? then fail
    if (typeof componentwalker.displayObject !== 'undefined') {
      return componentwalker.displayObject;
    }
    componentwalker = componentwalker._renderedComponent;
  }

  // we walked all the way down and found no displayObject
  return undefined;

}

//
// time to monkey-patch React!
//
// a subtle bug happens when ReactCompositeComponent updates something in-place by
// modifying HTML markup; since PIXI objects don't exist as markup the whole thing bombs.
// we try to fix this by monkey-patching ReactCompositeComponent
//
var originalCreateClass = React.createClass;

function createPIXIClass(spec) {

  var patchedspec = assign({}, spec, {
    updateComponent : function(transaction, prevParentDescriptor) {
      // Find the first actual rendered (non-Composite) component.
      // If that component is a PIXI nodes we use the special code here.
      // If not, we call back to the original updateComponent which should
      // handle all non-PIXI nodes.

      var prevDisplayObject = findDisplayObjectChild(this._renderedComponent);
      if (!prevDisplayObject) {
        // not a PIXI node, use the original version of updateComponent
        this.prototype.updateComponent(transaction, prevParentDescriptor);
        return;
      }

      // This is a PIXI node, do a special PIXI version of updateComponent
      ReactComponent.Mixin.updateComponent.call(
        this,
        transaction,
        prevParentDescriptor
      );

      var prevComponentInstance = this._renderedComponent;
      var prevElement = prevComponentInstance._currentElement;
      var nextElement = this._renderValidatedComponent();
      if (shouldUpdateReactComponent(prevElement, nextElement)) {
        prevComponentInstance.receiveComponent(nextElement, transaction);
      } else {
        // We can't just update the current component.
        // So we nuke the current instantiated component and put a new component in
        // the same place based on the new props.
        var rootID = this._rootNodeID;

        var displayObjectParent = prevDisplayObject.parent;

        if ("production" !== process.env.NODE_ENV) { // jshint ignore:line
          // this should produce the parent as well
          var displayObjectAncestor = findDisplayObjectAncestor(this);
          invariant(displayObjectAncestor === displayObjectParent,
                   'displayObject found by following _owner fields should match displayObject parent');
        }

        // unparent the current DisplayObject from its parent
        var displayObjectIndex = displayObjectParent.children.indexOf(prevDisplayObject);
        prevComponentInstance.unmountComponent();
        displayObjectParent.removeChild(prevDisplayObject);
        this.displayObject = null;

        // create the new object and stuff it into the place vacated by the old object
        this._renderedComponent = instantiateReactComponent(nextElement, this._currentElement.type);
        var nextDisplayObject = this._renderedComponent.mountComponent(
          rootID,
          transaction,
          this._mountDepth + 1
        );
        this.displayObject = nextDisplayObject;

        // fixup _mountImage as well
        this._mountImage = this.displayObject;
        displayObjectParent.addChildAt(nextDisplayObject, displayObjectIndex);
      }
    }
  });

  /* jshint validthis: true */
  var newclass = originalCreateClass(patchedspec);
  return newclass;

}

//
// The default module members are factories instead of components in order to more
// closely mimic the functionality of React.DOM.
// Raw components are still available under the 'components' member
//

function createPIXIFactory(ReactPIXIComponent)
{
  return ReactElement.createFactory(ReactPIXIComponent);
}

var PIXIComponents = {
  Stage : PIXIStage,
  DisplayObjectContainer : DisplayObjectContainer,
  Sprite : Sprite,
  Text : Text,
  BitmapText : BitmapText,
  TilingSprite : TilingSprite
};

var PIXIFactories = {};
for (var prop in PIXIComponents) {
    if (PIXIComponents.hasOwnProperty(prop)) {
      var component = PIXIComponents[prop];
      PIXIFactories[prop] = createPIXIFactory(component);
    }
}

// gaaah
React.createClass = createPIXIClass;

function dontUseReactPIXICreateClass(spec)
{
      warning(false, "ReactPIXI.createClass is no longer needed, use React.createClass instead");
      return createPIXIClass(spec);
}

module.exports =  assign(PIXIComponents, {
  factories: PIXIFactories,
  createClass: dontUseReactPIXICreateClass,
  CustomPIXIComponent : CustomPIXIComponent
});
