'use strict';

// ==========================
// exports
// ==========================

function ui_input (text) {
  let el = document.createElement('ui-input');
  el.value = text;

  return el;
}

module.exports = ui_input;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

class InputElement extends window.HTMLElement {
  get value () { return this._input.value; }
  set value ( val ) {
    this._input.value = val;
  }

  get placeholder () { return this._input.placeholder; }
  set placeholder ( val ) {
    this._input.placeholder = val;
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <input></input>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/input.css'),
      root.firstChild
    );

    this._mouseStartX = 0;
    this._inputFocused = false;
    this._selectAllWhenMouseUp = false;
    this._input = root.querySelector('input');
    this._input.value = this._initValue = this.getAttribute('value');
    this._input.placeholder = this.getAttribute('placeholder') || '';

    //
    this._initFocusable(this._input);

    // process events
    this.addEventListener('mousedown', this._mouseDownHandler);
    this.addEventListener('mousemove', this._mouseMoveHandler);
    this.addEventListener('mouseup', this._mouseUpHandler);
    this.addEventListener('keydown', this._keyDownHandler);
    this.addEventListener('focus-changed', this._focusChangedHandler);

    // process _input events
    this._input.addEventListener('focus', () => {
      this._inputFocused = true;
    });
    this._input.addEventListener('blur', () => {
      this._inputFocused = false;
    });
    this._input.addEventListener('change', event => {
      DomUtils.acceptEvent(event);
      this.confirm();
    });
    // NOTE: polymer can only listen to non-bubble event
    this._input.addEventListener('input', event => {
      DomUtils.acceptEvent(event);
      DomUtils.fire(this, 'input', { bubbles: true });
    });
    this._input.addEventListener('keydown', event => {
      // keydown 'enter'
      if (event.keyCode === 13) {
        DomUtils.acceptEvent(event);
        this.confirm(true);

        // blur _input, focus to :host
        this.focus();
      }
      // keydown 'esc'
      else if (event.keyCode === 27) {
        DomUtils.acceptEvent(event);
        this.cancel();

        // blur _input, focus to :host
        this.focus();
      }
    });
  }

  clear () {
    this._input.value = '';
    this.confirm();
  }

  confirm ( pressEnter ) {
    this._initValue = this._input.value;

    DomUtils.fire(this, 'confirm', {
      detail: {
        confirmByEnter: pressEnter,
      },
      bubbles: true
    });
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }

  cancel () {
    this._input.value = this._initValue;
    DomUtils.fire(this, 'input', { bubbles: true });
    DomUtils.fire(this, 'cancel', { bubbles: true });
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }

  _inputUnselect () {
    this._input.selectionStart = this._input.selectionEnd = -1;
  }

  _mouseDownHandler (event) {
    event.stopPropagation();

    this._mouseStartX = event.clientX;
    if ( !this._inputFocused ) {
      this._selectAllWhenMouseUp = true;
    }
    FocusMgr._setFocusElement(this);
  }

  _mouseUpHandler () {
    event.stopPropagation();

    if ( this._selectAllWhenMouseUp ) {
      this._selectAllWhenMouseUp = false;

      // if we drag select, don't do anything
      if ( Math.abs(event.clientX - this._mouseStartX) < 4 ) {
        this._input.select();
      }
    }
  }

  _keyDownHandler (event) {
    // keydown 'enter'
    if (event.keyCode === 13) {
      DomUtils.acceptEvent(event);
      this._initValue = this._input.value;
      this._input.focus();
      this._input.select();
    }
    // keydown 'esc'
    else if (event.keyCode === 27) {
      DomUtils.acceptEvent(event);
      FocusMgr._focusParent(this);
    }
  }

  _focusChangedHandler () {
    if ( this.focused ) {
      this._initValue = this._input.value;
    } else {
      this._inputUnselect();
    }
  }
}
JS.addon(InputElement.prototype, Focusable);

ui_input.element = InputElement;
