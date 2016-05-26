'use strict';

tap.test('<ui-button>', t => {
  const test = t.test;
  const helper = tap.helper;

  function _newElement ( cb ) {
    helper.runElement(
      'editor-framework://test/fixtures/button.html', 'simple', '#element', cb
    );
  }

  t.beforeEach(done => {
    Editor.Window.center();
    done();
  });

  t.afterEach(done => {
    helper.reset();
    done();
  });

  test('should have shadow root', t => {
    _newElement(el => {
      t.assert(el.shadowRoot);
      t.end();
    });
  });

  test('should focus on element when left mouse down', t => {
    _newElement(el => {
      helper.mousedown( el, 'left' );

      setTimeout(() => {
        t.equal(el.focused, true);
        t.end();
      }, 1);
    });
  });

  test('should send "click" event when mouse click element', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.end();
      });
      helper.click( el, 'left' );
    });
  });

  test('should send "click" event when "space" key down and up on the element', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.end();
      });
      helper.focus(el);
      helper.pressSpace();
    });
  });

  test('should send "click" event when "enter" key down on the element', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.end();
      });
      helper.focus(el);
      helper.keydown('enter');
    });
  });

  test('should not send "click" event when only "space" key up on the element', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.assert(false, 'should not recieve click event');
      });
      helper.focus(el);
      helper.keyup('space');

      setTimeout(() => {
        t.end();
      }, 100);
    });
  });

  test('should send "end-editing" event when element clicked', t => {
    _newElement(el => {
      el.addEventListener('end-editing', () => {
        t.end();
      });
      helper.click( el, 'left' );
    });
  });

  t.end();
});
