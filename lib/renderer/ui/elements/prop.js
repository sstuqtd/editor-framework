'use strict';

// ==========================
// exports
// ==========================

function ui_prop ( name ) {
  let el = document.createElement('ui-prop');
  el.name = name;

  return el;
}

module.exports = ui_prop;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const DomUtils = require('../utils/dom-utils');
// const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

class PropElement extends window.HTMLElement {

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <span class="label"></span>
      <content></content>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/prop.css'),
      root.firstChild
    );

    this._label = root.querySelector('.label');

    // init _name
    let name = this.getAttribute('name');
    if ( name !== null ) {
      this._name = name;
    } else {
      this._name = '-';
    }

    // init _indent
    let indent = this.getAttribute('indent');
    if ( indent !== null ) {
      this._label.style.paddingLeft = parseInt(indent) * 10 + 'px';
    }

    // update label
    this._label.innerText = this._name;

    // TODO
    // this._initFocusable(this);
    // this._initEvents();
  }

  _initEvents () {
    // TODO
  }
}

JS.addon(PropElement.prototype, Focusable);

ui_prop.element = PropElement;
