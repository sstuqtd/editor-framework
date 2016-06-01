'use strict';

suite(tap, 'dom-utils', t => {
  t.beforeEach(done => {
    Editor.Window.center();
    done();
  });

  t.afterEach(done => {
    helper.reset();
    done();
  });

  t.test('fire no-bubble event in shadow dom', t => {
    helper.runElement(
      'editor-framework://test/fixtures/dom-utils.html',
      'shadow-dom',
      '#wrapper',
      wrapper => {
        let subWrapper = wrapper.querySelector('#sub-wrapper');

        let shadowDOM = document.createElement('div');
        shadowDOM.id = 'parent';
        let shadow = shadowDOM.createShadowRoot();

        let shadowChild = document.createElement('div');
        shadowChild.id = 'child';
        shadow.appendChild(shadowChild);

        subWrapper.appendChild(shadowDOM);

        // ---

        subWrapper.addEventListener('foobar', () => {
          t.error(new Error(), 'wrapper should not recieve foobar');
        });

        shadowChild.addEventListener('foobar', event => {
          t.pass('the target child should fire the event');
          t.equal(event.target, shadowChild);
        });

        shadowDOM.addEventListener('foobar', event => {
          t.pass('the host element should fire the event');
          t.equal(event.target, shadowDOM);
        });

        Editor.UI.DomUtils.fire(shadowChild, 'foobar', {bubble: false});

        setTimeout(() => {
          t.end();
        }, 100);
      });
  });
});
