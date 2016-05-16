'use strict';

describe('<ui-slider>', function () {
  describe('html', function () {
    Helper.runElement('editor-framework://test/fixtures/slider.html', 'simple', '#element');

    beforeEach(function ( done ) {
      Editor.Window.center();

      done();
    });

    it('should have shadow root', function ( done ) {
      assert(Helper.targetEL.shadowRoot);

      done();
    });

    // it('should focus on element when left mouse down', function ( done ) {
    //   Helper.mousedown( Helper.targetEL, 'left' );

    //   setTimeout(function () {
    //     expect(Helper.targetEL.focused).to.equal(true);
    //     Helper.keydown( 'esc' );
    //     done();
    //   }, 1);
    // });
  });
});
