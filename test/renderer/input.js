'use strict';

describe('<ui-input>', function () {
  describe('html', function () {
    Helper.runElement('editor-framework://test/fixtures/input.html', 'simple', '#element');

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
        done();
      }, 1);
    });

    it('should get "Foobar" from value property', function ( done ) {
      expect(Helper.targetEL.value).to.equal('Foobar');
      done();
    });

    it('should send "cancel" when "esc" key down on the element', function ( done ) {
      Helper.targetEL.addEventListener('cancel', function () {
        done();
      });

      Helper.mousedown( Helper.targetEL, 'left' );
      setTimeout(function () {
        Helper.keydown('esc' );
      }, 10);
    });

    it('should send "confirm" when "enter" key down on the element', function ( done ) {
      Helper.targetEL.addEventListener('confirm', function () {
        done();
      });

      Helper.mousedown( Helper.targetEL, 'left' );
      setTimeout(function () {
        Helper.keydown('enter' );
      }, 10);
    });

    it('should directly change the text to "abc" when you click the element and type "abc"', function ( done ) {
      Helper.mousedown( Helper.targetEL, 'left' );
      Helper.keydown('a' );
      Helper.keydown('b' );
      Helper.keydown('c' );

      setTimeout(function () {
        expect(Helper.targetEL.value).to.equal('Foobar');
        done();
      }, 10);
    });
  });
});
