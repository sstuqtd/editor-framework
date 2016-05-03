'use strict';

// ==========================
// exports
// ==========================

module.exports = function (text) {
  let el = document.createElement('ui-button');
  el.innerText = text;

  return el;
};

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const ResUtils = require('../utils/res-utils');
const Focusable = require('../behaviors/focusable');

class Button extends window.HTMLElement {
  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="inner">
        <content></content>
      </div>
    `;
    root.insertBefore(
      ResUtils.createStyleElement('editor-framework://lib/renderer/ui/widgets/button.css'),
      root.firstChild
    );

    this._initFocusable(this);
  }
}
JS.addon(Button.prototype, Focusable);

document.registerElement('ui-button', Button);
