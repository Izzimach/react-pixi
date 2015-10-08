describe("PIXI Composite components", function() {
  var DisplayObjectContainer = React.createFactory(ReactPIXI.DisplayObjectContainer);
  var Sprite = React.createFactory(ReactPIXI.Sprite);
  var Stage = React.createFactory(ReactPIXI.Stage);
  var Text = React.createFactory(ReactPIXI.Text);

  var mountpoint = null;

  beforeEach(function() { mountpoint = createTestFixtureMountPoint(); });
  afterEach(function() { removeTestFixtureMountPoint(mountpoint); });

  it("correctly replaces PIXI objects instead of setting HTML markup when replacing components in-place", function() {

    //
    // This occurs when a composite element is updated in-place. To create this (admittedly uncommon)
    // situation we create a composite component that changes the key of its child while everything else
    // (including the key of the composite element) remains unchanged.  In this case _updateChildren in ReactMultiChildMixin
    // will update in-place and then updateComponent in ReactCompositeComponentMixin will try to nuke and replace the child
    // component since the keys don't match.
    //
    var injectedKeyComponent = React.createClass({
      displayName: 'injectedKeyComponent',
      render: function () {
        var propswithkey = _.clone(this.props);
        propswithkey.key = this.props.injectedkey;
        return DisplayObjectContainer(propswithkey);
      }
    });
    var injectedKeyFactory = React.createFactory(injectedKeyComponent);

    // note we use React.createClass, not ReactPIXI.createClass, since the Stage
    // is actually a <canvas> DOM element!
    var injectedKeyStage = React.createClass({
      displayName: 'injectedKeyStage',
      render: function () {
        return Stage({width:this.props.width, height:this.props.height, ref:'stage'},
        injectedKeyFactory({x:100, y:100, key: 'argh', injectedkey:this.props.injectedkey}));
      }
    });
    var injectedKeyStageFactory = React.createFactory(injectedKeyStage);

    // generate two sets of props, identical except that they contain different
    // values of injectedkey.

    var baseprops = {width:300, height:300, key:'argh'};
    var addinjectedkey = function(originalprops, injectedkey) {
      var newprops = _.clone(originalprops);
      newprops.injectedkey = injectedkey;
      return newprops;
    };
    var props1 = addinjectedkey(baseprops, 'one');
    var props2 = addinjectedkey(baseprops, 'two');

    //
    // render with the original set of props, then again with a new injected key.
    // this should keep the same injectedKeyComponent instance but force React to
    // replace the DisplayObjectContainer inside of injectedKeyComponent. If we
    // don't switch to a different key then React will just update the current instance
    // of DisplayObjectContainer instead of try to replace it.
    //
    var reactinstance = ReactPIXI.render(injectedKeyStageFactory(props1),mountpoint);

    // this should destroy and replace the child instance instead of updating it
    reactinstance = ReactPIXI.render(injectedKeyStageFactory(props2),mountpoint);


    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).toBe('CANVAS');

    // the tree from here on down is pixi objects, not DOM nodes
    expect(mountpoint.childNodes[0].childNodes.length).toBe(0);

    // examine the pixi objects
    var stage = reactinstance.refs['stage']._displayObject;
    expect(stage.children.length).toBe(1);
  });

  it ("correctly replaces owned components", function() {
    // if a composite component switches its child (the root component
    // that is returned by the render method) it should remove the old
    // child and add the new child. This also requires doing the same
    // thing to the parallel tree used by PIXI. But since the composite
    // itself itsn't part of PIXI scene graph this can get tricky.
    // see issue #7
    var changedChildComponent = React.createClass({
      displayName:'changeChildComponent',
      render: function () {
        var compositechild = this.props.renderstate;
        if (this.props.thingindex === 1) {
          return Text({text:'oldtext',key:1});
        } else {
          return Text({text:this.props.text,key:2});
        }
      }
    });
    var changedChildStageFactory = React.createFactory(React.createClass({
      render: function() {
        return Stage({width:300,height:300,ref:'stage'},
          React.createElement(changedChildComponent, this.props));
        }
    }));

    var reactinstance = ReactPIXI.render(changedChildStageFactory({thingindex:1,text:'newtext'}), mountpoint);

    var stage = reactinstance.refs['stage']._displayObject;
    expect(stage.children.length).toBe(1);

    // should switch from DoC to Text node... the old DoC shouldn't be
    // stash somewhere (in _mountImage perhaps)
    reactinstance = ReactPIXI.render(changedChildStageFactory({thingindex:2,text:'newtext'}), mountpoint);
    expect(stage.children.length).toBe(1);

    // If buggy, this will pull the old node (DoC) and add it in, resulting
    // in two children
    reactinstance = ReactPIXI.render(changedChildStageFactory({thingindex:1,text:'ack'}), mountpoint);
    expect(stage.children.length).toBe(1); // might be 0 or 2 if buggy
  });


  it("still works on non-PIXI nodes", function () {
    // we need to fall back on the default DOM behavior for nodes that are
    // not PIXI elements. So we'll do the same tests as above but with DOM nodes

    var injectedKeyFactory = React.createFactory(React.createClass({
      displayName: 'injectedKeyComponent',
      render : function() {
        var propswithkey = _.clone(this.props);
        propswithkey.key = this.props.injectedkey;
        return React.createElement('div', propswithkey);
      }
    }));
    var injectedKeyStageFactory = React.createFactory(React.createClass({
      displayName: 'injectedKeyStage',
      render: function () {
        return React.createElement('div', {ref:'rootnode'},
                                   injectedKeyFactory({key:'argh', injectedkey:this.props.injectedkey}));
      }
    }));

    var baseprops = {key:'argh'};
    var addinjectedkey = function(originalprops, injectedkey) {
      var newprops = _.clone(originalprops);
      newprops.injectedkey = injectedkey;
      return newprops;
    };
    var props1 = addinjectedkey(baseprops, 'one');
    var props2 = addinjectedkey(baseprops, 'two');

    var reactinstance = ReactPIXI.render(injectedKeyStageFactory(props1),mountpoint);

    // this should destroy and replace the child instance instead of updating it
    reactinstance = ReactPIXI.render(injectedKeyStageFactory(props2),mountpoint);

    expect(mountpoint.childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].nodeName).toBe('DIV');
    expect(mountpoint.childNodes[0].childNodes.length).toBe(1);
    expect(mountpoint.childNodes[0].childNodes[0].nodeName).toBe('DIV');
  });

});
