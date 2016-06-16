'use strict';

// requires
const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');

module.exports = ElementUtils.registerElement('ui-select', {
  /**
   * @property value
   */
  get value () {
    return this.$select.value;
  },
  set value (val) {
    this.$select.value = val;
  },

  /**
   * @property selectedIndex
   */
  get selectedIndex () {
    return this.$select.selectedIndex;
  },
  set selectedIndex (val) {
    this.$select.selectedIndex = val;
  },

  /**
   * @property selectedText
   */
  get selectedText () {
    return this.$select.item(this.$select.selectedIndex).text;
  },

  behaviors: [ Focusable, Disable, Readonly ],

  template: `
    <select></select>
  `,

  style: ResMgr.getResource('editor-framework://dist/css/elements/select.css'),

  $: {
    select: 'select',
  },

  ready () {
    // init $select
    let list = [].slice.call( this.children, 0 );
    list.forEach(el => {
      this.$select.add(el, null);
    });

    let initValue = this.getAttribute('value');
    if ( initValue !== null ) {
      this.$select.value = initValue;
    }

    // init focusable
    this._initFocusable(this.$select);
    this._initDisable(false);
    this._initReadonly(false);

    // process events
    this.addEventListener('mousedown', this._mouseDownHandler);

    this.$select.addEventListener('keydown', event => {
      if ( this.disabled ) {
        event.preventDefault();
        return;
      }

      if ( this.readonly ) {
        event.preventDefault();
        return;
      }

      // arrow-up & arrow-down should be used as navigation
      if (
        event.keyCode === 38 ||
        event.keyCode === 40
      ) {
        event.preventDefault();
      }

      // if this is not space key, prevent typing for select
      if ( event.keyCode !== 32 && !event.ctrlKey && !event.metaKey ) {
        event.preventDefault();
      }
    });

    this.$select.addEventListener('change', event => {
      DomUtils.acceptEvent(event);
      DomUtils.fire(this, 'confirm', {
        bubbles: false,
        detail: {
          index: this.selectedIndex,
          value: this.value,
          text: this.selectedText,
        },
      });
    });
  },

  created ( value ) {
    if ( !isNaN(value) ) {
      this.value = value;
    }
  },

  _mouseDownHandler (event) {
    event.stopPropagation();

    this._mouseStartX = event.clientX;
    if ( !this._inputFocused ) {
      this._selectAllWhenMouseUp = true;
    }
    FocusMgr._setFocusElement(this);

    if ( this.readonly ) {
      DomUtils.acceptEvent(event);
      return;
    }
  },

  addItem (value, text, beforeIndex) {
    let optEL = document.createElement('option');
    optEL.value = value;
    optEL.text = text;

    let beforeEL;
    if ( beforeIndex !== undefined ) {
      beforeEL = this.$select.item(beforeIndex);
    } else {
      beforeEL = null;
    }
    this.$select.add( optEL, beforeEL );
  },

  // NOTE: do not use remove which is DOM function
  removeItem (index) {
    this.$select.remove(index);
  },

  clear () {
    DomUtils.clear(this.$select);
  },
});
