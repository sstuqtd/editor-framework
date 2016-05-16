'use strict';

describe('<ui-select>', function () {
  describe('html', function () {
    Helper.runElement('editor-framework://test/fixtures/select.html', 'simple', '#element');

    beforeEach(function ( done ) {
      Editor.Window.center();

      done();
    });

    it('should have shadow root', function ( done ) {
      assert(Helper.targetEL.shadowRoot);

      done();
    });

    it('should focus on element when left mouse down', function ( done ) {
      Helper.mousedown( Helper.targetEL, 'left' );

      setTimeout(function () {
        expect(Helper.targetEL.focused).to.equal(true);
        Helper.keydown( 'esc' );
        done();
      }, 1);
    });

    it('should get "1" from value property', function ( done ) {
      expect(Helper.targetEL.value).to.equal('1');
      done();
    });

    it('should get "Bar" from selectedText property', function ( done ) {
      expect(Helper.targetEL.selectedText).to.equal('Bar');
      done();
    });
  });
});
