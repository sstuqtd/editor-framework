'use strict';

// ==========================
// exports
// ==========================

function ui_select (text) {
  let el = document.createElement('ui-select');
  el.innerText = text;

  return el;
}

module.exports = ui_select;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const DomUtils = require('../utils/dom-utils');
const Focusable = require('../behaviors/focusable');

class SelectElement extends window.HTMLSelectElement {
  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <select></select>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/select.css'),
      root.firstChild
    );

    this._select = root.querySelector('select');
    let list = [].slice.call( this.children, 0 );
    list.forEach(el => {
      this._select.add(el, null);
    });

    this._initFocusable(this);
  }
}

JS.addon(SelectElement.prototype, Focusable);

ui_select.element = SelectElement;
