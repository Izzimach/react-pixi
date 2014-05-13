describe("PIXI DisplayObjectContainer Component", function() {

  var fixture = window.document.createElement('div');
  fixture.id = 'test-fixture';
  window.document.body.appendChild(fixture);

  // this component just renders a DisplayObjectContainer which
  // has some specific number of DisplayObjectContainer objects as children.
  // you specify the number of children as props.childCount
  var variableChildrenComponent = React.createClass({
    displayName: 'VariableChildrenComponent',
    render: function () {
      var children = [];
      for (var childindex=0; childindex < this.props.childCount; childindex++) {
        var somechild = React.PIXI.DisplayObjectContainer(
          {
            key:childindex,
            ref:'child' + childindex.toString(),
            x:childindex
          }
        );
        children.push(somechild);
      }
      return React.PIXI.Stage({width:this.props.width, height:this.props.height, ref:'stage'}, [React.PIXI.DisplayObjectContainer({key:'argh', ref:'testpoint'}, children)]);
    }
  });

  var maxtestchildren = 10;


  it("maintains proper references to the parent DisplayObject", function() {
    var reactinstance = React.renderComponent(
        variableChildrenComponent({width:300,height:300,childCount:1}),
        fixture);

    var stage = reactinstance.refs['stage'].displayObject;
    var testpoint = reactinstance.refs['testpoint'].displayObject;

    expect(testpoint.parent).toBe(stage);

    React.unmountComponentAtNode(fixture);
  });

  it("can hold a variable number of children", function() {

    for (var numchildren = 0; numchildren < maxtestchildren; numchildren++) {
      var reactinstance = React.renderComponent(
        variableChildrenComponent({width:300,height:300,childCount:numchildren}),
        fixture);

      expect(fixture.childNodes.length).toBe(1);
      expect(fixture.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(fixture.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].displayObject;
      var testpoint = reactinstance.refs['testpoint'].displayObject;

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);

      // make sure they're in the right order by examing the x-coordinate of
      // each child display object
      for (var testindex=0; testindex < numchildren; testindex++) {
        expect(testpoint.children[testindex].x).toBeCloseTo(testindex,2);
      }

      React.unmountComponentAtNode(fixture);
    }
  });

  it ("can add DisplayObjects to an already-mounted tree", function() {
    var reactinstance = React.renderComponent(
      variableChildrenComponent({width:300,height:300,childCount:0}),
      fixture);

    for (var numchildren = 1; numchildren < maxtestchildren; numchildren++) {

      // this should add another DisplayObject as a child
      reactinstance.setProps({width:300,height:300,childCount:numchildren});

      expect(fixture.childNodes.length).toBe(1);
      expect(fixture.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(fixture.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].displayObject;
      var testpoint = reactinstance.refs['testpoint'].displayObject;

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);

      // here we don't unmount, so that the next time through React has to
      // add children instead of building them anew.
    }

    React.unmountComponentAtNode(fixture);
  });

  it("can remove DisplayObjects from an already-mounted tree", function() {
    var reactinstance = React.renderComponent(
      variableChildrenComponent({width:300,height:300,childCount:maxtestchildren}),
      fixture);

    for (var numchildren = maxtestchildren-1; numchildren > 0; numchildren--) {

      // this should remove an already existing child
      reactinstance.setProps({width:300,height:300,childCount:numchildren});

      expect(fixture.childNodes.length).toBe(1);
      expect(fixture.childNodes[0].nodeName).toBe('CANVAS');

      // the tree from here on down is pixi objects, no DOM nodes
      expect(fixture.childNodes[0].childNodes.length).toBe(0);

      // examine the pixi objects
      var stage = reactinstance.refs['stage'].displayObject;
      var testpoint = reactinstance.refs['testpoint'].displayObject;

      expect(stage.children.length).toBe(1);
      expect(testpoint.children.length).toBe(numchildren);
    }

    React.unmountComponentAtNode(fixture);
  });

  fixture.parentNode.removeChild(fixture);

});
