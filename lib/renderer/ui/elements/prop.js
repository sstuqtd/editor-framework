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
      <div class="wrapper">
        <div class="label">
          <i class="fold icon-fold-up"></i>
          <span class="text"></span>
        </div>
        <content select=":not(.custom-block)"></content>
      </div>
      <content select=".custom-block"></content>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/prop.css'),
      root.firstChild
    );

    this._label = root.querySelector('.label');
    this._fold = root.querySelector('.fold');
    this._text = root.querySelector('.text');

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
    this._text.innerText = this._name;

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
