// since Sprite is a subclass of DisplayObjectContainer most
// of the functionality will have been checked by previous tests
// the main thing to test here is that pixels get put on the screen

describe("PIXI Sprite Component", function() {

  // need to prepend 'base' to the path since that's how the karma webserver
  // routes static file serving
  var imagePath = 'base/test/pixels/';
  var pixelReferenceImage = function(index) {
    return [imagePath, 'testrender',index,'.png'].join('');
  };

  var fixture = window.document.createElement('div');
  fixture.id = 'test-fixture';
  window.document.body.appendChild(fixture);

  it("puts pixels on the canvas", function(done) {
    pixelTests(fixture, imagePath, function (results) {
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      var comparesperformed = 0;
      for (var compareindex=0; compareindex < results.length; compareindex++) {
        var refimageURI = pixelReferenceImage(compareindex);
        var testimage = results[compareindex];

        resemble(testimage)
          .compareTo(refimageURI)
          .onComplete(function (data) {
            expect(data).toBeDefined();
            expect(typeof data).toEqual('object');
            expect(data.isSameDimensions).toEqual(true);
            if (data.misMatchPercentage > 0.2) {
              console.log("mismatch is " + data.misMatchPercentage.toString());
            }
            expect(data.misMatchPercentage).toBeLessThan(0.2);

            comparesperformed++;
            if (comparesperformed === results.length) {
              done();
            }
          });
      }

    });
  });

  fixture.parentNode.removeChild(fixture);
});
