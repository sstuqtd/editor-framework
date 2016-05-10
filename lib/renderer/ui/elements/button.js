'use strict';

// ==========================
// exports
// ==========================

function ui_button (text) {
  let el = document.createElement('ui-button');
  el.innerText = text;

  return el;
}

module.exports = ui_button;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const Focusable = require('../behaviors/focusable');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');

class ButtonElement extends window.HTMLElement {
  /**
   * @property row
   */
  get pressed () {
    return this.getAttribute('pressed') !== null;
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="inner">
        <content></content>
      </div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/button.css'),
      root.firstChild
    );

    this._initFocusable(this);

    // process events
    DomUtils.installDownUpEvent(this);

    // keydown
    this.addEventListener('keydown', event => {
      if ( event.code === 'Space' ) {
        this._spaceKeyDownHandler(event);
      } else if ( event.code === 'Enter' ) {
        this._enterKeyDownHandler(event);
      }
    });

    // keyup
    this.addEventListener('keyup', event => {
      if ( event.code === 'Space' ) {
        this._spaceKeyUpHandler(event);
      }
    });

    // down
    this.addEventListener('down', event => {
      this._mouseDownHandler(event);
    });

    // up
    this.addEventListener('up', event => {
      this._mouseUpHandler(event);
    });
  }

  _setPressed (val) {
    if (val) {
      this.setAttribute('pressed', '');
    } else {
      this.removeAttribute('pressed');
    }
  }

  _spaceKeyDownHandler (event) {
    DomUtils.acceptEvent(event);

    this._setPressed(true);
  }

  _spaceKeyUpHandler (event) {
    DomUtils.acceptEvent(event);

    this._setPressed(false);
  }

  _enterKeyDownHandler (event) {
    DomUtils.acceptEvent(event);
    this._asyncClick();
  }

  _mouseDownHandler (event) {
    DomUtils.acceptEvent(event);

    FocusMgr._setFocusElement(this);
    this._setPressed(true);
  }

  _mouseUpHandler (event) {
    DomUtils.acceptEvent(event);

    this._setPressed(false);
  }

  _asyncClick () {
    this._setPressed(true);
    setTimeout(() => {
      this._setPressed(false);
      this.click();
    },10);
  }
}
JS.addon(ButtonElement.prototype, Focusable);

ui_button.element = ButtonElement;
