'use strict';

describe('<ui-input>', function () {
  describe('html', () => {
    Helper.runElement('editor-framework://test/fixtures/input.html', 'simple', '#element');

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

    it('should get "Foobar" from value property', done => {
      expect(Helper.targetEL.value).to.equal('Foobar');
      done();
    });

    it('should send "cancel" when "esc" key down on the element', done => {
      Helper.targetEL.addEventListener('cancel', () => {
        done();
      });

      Helper.mousedown( Helper.targetEL, 'left' );
      setTimeout(() => {
        Helper.keydown('esc' );
      }, 10);
    });

    it('should send "confirm" when "enter" key down on the element', done => {
      Helper.targetEL.addEventListener('confirm', () => {
        done();
      });

      Helper.mousedown( Helper.targetEL, 'left' );
      setTimeout(() => {
        Helper.keydown('enter' );
      }, 10);
    });

    it('should directly change the text to "abc" when you click the element and type "abc"', done => {
      Helper.mousedown( Helper.targetEL, 'left' );
      Helper.keydown('a' );
      Helper.keydown('b' );
      Helper.keydown('c' );

      setTimeout(() => {
        expect(Helper.targetEL.value).to.equal('Foobar');
        done();
      }, 10);
    });
  });
});
