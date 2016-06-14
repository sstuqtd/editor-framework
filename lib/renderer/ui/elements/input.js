'use strict';

// requires
const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const InputState = require('../behaviors/input-state');

module.exports = ElementUtils.registerElement('ui-input', {
  get value () { return this._input.value; },
  set value ( val ) {
    this._input.value = val;
  },

  get placeholder () { return this._input.placeholder; },
  set placeholder ( val ) {
    this._input.placeholder = val;
  },

  /**
   * @property readonly
   */
  get readonly () {
    return this.getAttribute('readonly') !== null;
  },
  set readonly (val) {
    if (val) {
      this.setAttribute('readonly', '');
      this._input.readOnly = true;
    } else {
      this.removeAttribute('readonly');
      this._input.readOnly = false;
    }
  },

  behaviors: [ Focusable, InputState ],

  template: `
    <input></input>
  `,

  style: ResMgr.getResource('editor-framework://dist/css/elements/input.css'),

  ready () {
    let root = this.shadowRoot;

    this._input = root.querySelector('input');
    this._input.value = this.getAttribute('value');
    this._input.placeholder = this.getAttribute('placeholder') || '';
    this._input.readOnly = this.getAttribute('readonly') !== null;

    //
    this._initFocusable(this, this._input);
    this._initInputState(this._input);

    //
    this._initEvents();
  },

  created (text) {
    if ( text ) {
      this.value = text;
    }
  },

  clear () {
    this._input.value = '';
    this.confirm();
  },

  confirm () {
    this._onInputConfirm(this._input);
  },

  cancel () {
    this._onInputCancel(this._input);
  },

  _initEvents () {
    this.addEventListener('mousedown', this._mouseDownHandler);
    this.addEventListener('keydown', this._keyDownHandler);
    this.addEventListener('focus-changed', this._focusChangedHandler);
  },

  _onInputConfirm ( inputEL, pressEnter ) {
    if ( !this.readonly ) {
      if ( this._changed ) {
        this._changed = false;
        inputEL._initValue = inputEL.value;

        DomUtils.fire(this, 'confirm', {
          bubbles: false,
          detail: {
            value: inputEL.value,
            confirmByEnter: pressEnter,
          },
        });
      }
    }

    if ( pressEnter ) {
      // blur inputEL, focus to :host
      this.focus();
    }
  },

  _onInputCancel ( inputEL, pressEsc ) {
    if ( !this.readonly ) {
      if ( this._changed ) {
        this._changed = false;

        // reset to init value and emit change event
        if ( inputEL._initValue !== inputEL.value ) {
          inputEL.value = inputEL._initValue;

          DomUtils.fire(this, 'change', {
            bubbles: false,
            detail: {
              value: inputEL.value,
            },
          });
        }

        DomUtils.fire(this, 'cancel', {
          bubbles: false,
          detail: {
            value: inputEL.value,
            cancelByEsc: pressEsc,
          },
        });
      }
    }

    if ( pressEsc ) {
      // blur inputEL, focus to :host
      inputEL.blur();
      this.focus();
    }
  },

  _onInputChange ( inputEL ) {
    this._changed = true;

    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: inputEL.value,
      },
    });
  },

  _mouseDownHandler (event) {
    event.stopPropagation();
    FocusMgr._setFocusElement(this);
  },

  _keyDownHandler (event) {
    if ( this.disabled ) {
      return;
    }

    // keydown 'enter' or 'space'
    if (event.keyCode === 13 || event.keyCode === 32) {
      DomUtils.acceptEvent(event);
      this._input._initValue = this._input.value;
      this._input.focus();
      this._input.select();
    }

    // DISABLE
    // // keydown 'esc'
    // else if (event.keyCode === 27) {
    //   DomUtils.acceptEvent(event);
    //   // FocusMgr._focusParent(this); // DISABLE
    //   this.focus();
    // }
  },

  _focusChangedHandler () {
    if ( this.focused ) {
      this._input._initValue = this._input.value;
    } else {
      this._unselect(this._input);
    }
  },
});
