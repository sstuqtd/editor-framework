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

    this.addEventListener('keydown', event => {
      if ( event.keyCode === 32 /*space*/ ) {
        this._spaceKeyDownHandler(event);
      } else if ( event.keyCode === 13 /*enter*/ ) {
        this._enterKeyDownHandler(event);
      }
    });
    this.addEventListener('keyup', event => {
      if ( event.keyCode === 32 /*space*/ ) {
        this._spaceKeyUpHandler(event);
      }
    });
    this.addEventListener('down', this._mouseDownHandler);
    this.addEventListener('up', this._mouseUpHandler);
    this.addEventListener('click', this._clickHandler);
    this.addEventListener('focus-changed', this._focusChangedHandler);
  }

  _setPressed (val) {
    if (val) {
      this.setAttribute('pressed', '');
    } else {
      this.removeAttribute('pressed');
    }
  }

  _asyncClick () {
    setTimeout(() => {
      this.click();
    },1);
  }

  _spaceKeyDownHandler (event) {
    DomUtils.acceptEvent(event);

    this._setPressed(true);
  }

  _spaceKeyUpHandler (event) {
    DomUtils.acceptEvent(event);

    if ( this.pressed ) {
      this._asyncClick();
    }
    this._setPressed(false);
  }

  _enterKeyDownHandler (event) {
    DomUtils.acceptEvent(event);

    if ( this._enterTimeoutID ) {
      return;
    }

    this._setPressed(true);
    this._enterTimeoutID = setTimeout(() => {
      this._enterTimeoutID = null;
      this._setPressed(false);
      this.click();
    },100);
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

  _clickHandler () {
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }

  _focusChangedHandler () {
    if ( !this.focused ) {
      this._setPressed(false);
    }
  }
}
JS.addon(ButtonElement.prototype, Focusable);

ui_button.element = ButtonElement;
