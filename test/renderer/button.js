'use strict';

describe('<ui-button>', function () {
  describe('html', function () {
    Helper.runElement('editor-framework://test/fixtures/button.html', 'simple', '#btn');

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

    it('should send "click" event when mouse click element', function ( done ) {
      Helper.targetEL.addEventListener('click', function () {
        done();
      });
      Helper.click( Helper.targetEL, 'left' );
    });

    it('should send "click" event when "space" key down and up on the element', function ( done ) {
      Helper.targetEL.addEventListener('click', function () {
        done();
      });
      Helper.pressSpace( Helper.targetEL );
    });

    it('should send "click" event when "enter" key down on the element', function ( done ) {
      Helper.targetEL.addEventListener('click', function () {
        done();
      });
      Helper.keydown( Helper.targetEL, 'enter' );
    });

    it('should not send "click" event when only "space" key up on the element', function ( done ) {
      Helper.targetEL.addEventListener('click', function () {
        assert(false, 'should not recieve click event');
      });
      Helper.keyup( Helper.targetEL, 'space' );

      setTimeout(function () {
        done();
      }, 100);
    });

    it('should send "end-editing" event when element clicked', function ( done ) {
      Helper.targetEL.addEventListener('end-editing', function () {
        done();
      });
      Helper.click( Helper.targetEL, 'left' );
    });
  });
});
