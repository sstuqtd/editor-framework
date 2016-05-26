'use strict';

describe('<ui-slider>', function () {
  describe('html', () => {
    Helper.runElement('editor-framework://test/fixtures/slider.html', 'simple', '#element');

    beforeEach(done => {
      Editor.Window.center();

      done();
    });

    it('should have shadow root', done => {
      assert(Helper.targetEL.shadowRoot);

      done();
    });

    // it('should focus on element when left mouse down', done => {
    //   Helper.mousedown( Helper.targetEL, 'left' );

    //   setTimeout(() => {
    //     expect(Helper.targetEL.focused).to.equal(true);
    //     Helper.keydown( 'esc' );
    //     done();
    //   }, 1);
    // });
  });
});
