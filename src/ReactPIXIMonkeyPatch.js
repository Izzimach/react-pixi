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
// time to monkey-patch React!
//
// a subtle bug happens when ReactCompositeComponent updates something in-place by
// modifying HTML markup; since PIXI objects don't exist as markup the whole thing bombs.
// we try to fix this by monkey-patching ReactCompositeComponent
//

"use strict";

import ReactCompositecomponent, {Mixin as ReactCompositeComponentMixin} from 'react/lib/ReactCompositeComponent';
import ReactReconciler from 'react/lib/ReactReconciler';

import shouldUpdateReactComponent from 'react/lib/shouldUpdateReactComponent';
import warning from 'fbjs/lib/warning';

//
// Composite components don't have a displayObject. So we have to do some work to find
// the proper displayObject sometimes.
//


function findDisplayObjectChild(componentinstance) {
  // walk downwards via _renderedComponent to find something with a displayObject
  var componentwalker = componentinstance;
  while (typeof componentwalker !== 'undefined') {
    // no displayObject? then fail
    if (typeof componentwalker._displayObject !== 'undefined') {
      return componentwalker._displayObject;
    }
    componentwalker = componentwalker._renderedComponent;
  }

  // we walked all the way down and found no displayObject
  return undefined;

}

//
// This modified version of updateRenderedComponent will
// manage displayObject nodes instead of HTML markup
//
let old_updateRenderedComponent = ReactCompositeComponentMixin._updateRenderedComponent;

let ReactPIXI_updateRenderedComponent = function(transaction, context) {
  var prevComponentInstance = this._renderedComponent;
  
  // Find the first actual rendered (non-Composite) component.
  // If that component is a PIXI node we use the special code here.
  // If not, we call back to the original version of updateComponent
  // which should handle all non-PIXI nodes.
  
  let prevDisplayObject = findDisplayObjectChild(prevComponentInstance);
  if (!prevDisplayObject) {
    // not a PIXI node, use the original DOM-style version
    old_updateRenderedComponent.call(this,transaction, context);
    return;
  }
  
  // This is a PIXI node, do a special PIXI version of updateComponent
  let prevRenderedElement = prevComponentInstance._currentElement;
  let nextRenderedElement = this._renderValidatedComponent();
  
  if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
    ReactReconciler.receiveComponent(
      prevComponentInstance,
      nextRenderedElement,
      transaction,
      this._processChildContext(context)
    );
  } else {
    // We can't just update the current component.
    // So we nuke the current instantiated component and put a new component in
    // the same place based on the new props.
    let thisID = this._rootNodeID;
    
    let displayObjectParent = prevDisplayObject.parent;
    
    // unmounting doesn't disconnect the child from the parent node,
    // but later on we'll simply overwrite the proper element in the 'children' data member
    let displayObjectIndex = displayObjectParent.children.indexOf(prevDisplayObject);
    ReactReconciler.unmountComponent(prevComponentInstance);
    displayObjectParent.removeChild(prevDisplayObject);
    
    // create the new object and stuff it into the place vacated by the old object
    this._renderedComponent = this._instantiateReactComponent(
      nextRenderedElement,
      this._currentElement.type);
    let nextDisplayObject = ReactReconciler.mountComponent(
      this._renderedComponent,
      thisID,
      transaction,
      this._processChildContext(context)
    );
    this._renderedComponent._displayObject = nextDisplayObject;
    
    // fixup _mountImage as well
    this._mountImage = nextDisplayObject;
    
    // overwrite the reference to the old child
    displayObjectParent.addChildAt(nextDisplayObject, displayObjectIndex);
  }
};

//
// This generates a patched version of ReactReconciler.receiveComponent to check the type of the
// component and patch it if it's an unpatched version of ReactCompositeComponentWrapper
//

let buildPatchedReceiveComponent = function(oldReceiveComponent) {
  let newReceiveComponent = function(
        internalInstance, nextElement, transaction, context
  ) {
    // if the instance is a ReactCompositeComponentWrapper, fix it if needed
    let ComponentPrototype = Object.getPrototypeOf(internalInstance);

    // if this is a composite component it wil have _updateRenderedComponent defined
    if (typeof ComponentPrototype._updateRenderedComponent !== 'undefined') {
      // check first to make sure we don't patch it twice
      if (ComponentPrototype._updateRenderedComponent !== ReactPIXI_updateRenderedComponent) {
	ComponentPrototype._updateRenderedComponent = ReactPIXI_updateRenderedComponent;
      }
    }

    oldReceiveComponent.call(this,internalInstance, nextElement, transaction, context);
  };

  return newReceiveComponent;
};


let ReactPIXIMonkeyPatch = function() {

  // in older versions we patched ReactCompositeComponentMixin, but in 0.13 the
  // prototype is wrapped in a ReactCompositeComponentWrapper so monkey-patching
  // ReactCompositeComponentMixin won't actually have any effect.
  //
  // Really we want to patch ReactCompositeComponentWrapper but it's hidden inside
  // the instantiateReactComponent module. urgh.
  //
  // So what we have to do is patch ReactReconciler to detect the first time an
  // instance of ReactCompositeComponentWrapper is used, and patch it THEN
  //
  // urk.

  let old_ReactReconciler_receiveComponent = ReactReconciler.receiveComponent;

  // check to see if we already patched it, so we don't patch again
  if (typeof old_ReactReconciler_receiveComponent._ReactPIXIPatched === 'undefined') {
    warning(false,"patching react to work with react-pixi");

    ReactReconciler.receiveComponent = buildPatchedReceiveComponent(old_ReactReconciler_receiveComponent);
    ReactReconciler.receiveComponent._ReactPIXIPatched = true;
  }
};

export default ReactPIXIMonkeyPatch;
