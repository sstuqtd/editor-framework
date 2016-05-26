'use strict';

describe('<ui-button>', function () {
  describe('html', () => {
    Helper.runElement('editor-framework://test/fixtures/button.html', 'simple', '#element');

    beforeEach(done => {
      Editor.Window.center();

      done();
    });

    it('should have shadow root', done => {
      assert(Helper.targetEL.shadowRoot);

      done();
    });

    it('should focus on element when left mouse down', done => {
      Helper.mousedown( Helper.targetEL, 'left' );

      setTimeout(() => {
        expect(Helper.targetEL.focused).to.equal(true);
        done();
      }, 1);
    });

    it('should send "click" event when mouse click element', done => {
      Helper.targetEL.addEventListener('click', () => {
        done();
      });
      Helper.click( Helper.targetEL, 'left' );
    });

    it('should send "click" event when "space" key down and up on the element', done => {
      Helper.targetEL.addEventListener('click', () => {
        done();
      });
      Helper.focus(Helper.targetEL);
      Helper.pressSpace();
    });

    it('should send "click" event when "enter" key down on the element', done => {
      Helper.targetEL.addEventListener('click', () => {
        done();
      });
      Helper.focus(Helper.targetEL);
      Helper.keydown('enter');
    });

    it('should not send "click" event when only "space" key up on the element', done => {
      Helper.targetEL.addEventListener('click', () => {
        assert(false, 'should not recieve click event');
      });
      Helper.focus(Helper.targetEL);
      Helper.keyup('space');

      setTimeout(() => {
        done();
      }, 100);
    });

    it('should send "end-editing" event when element clicked', done => {
      Helper.targetEL.addEventListener('end-editing', () => {
        done();
      });
      Helper.click( Helper.targetEL, 'left' );
    });
  });
});
