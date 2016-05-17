'use strict';

const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');

// ==========================
// exports
// ==========================

let InputState = {
  _initInputState ( inputEL ) {
    if ( !this._onInputConfirm ) {
      throw new Error('Failed to init input-state: please implement _onInputConfirm');
    }
    if ( !this._onInputCancel ) {
      throw new Error('Failed to init input-state: please implement _onInputCancel');
    }
    if ( !this._onInputChange ) {
      throw new Error('Failed to init input-state: please implement _onInputChange');
    }

    inputEL._initValue = inputEL.value;
    inputEL._focused = false;
    inputEL._selectAllWhenMouseUp = false;
    inputEL._mouseStartX = -1;

    // process inputEL events
    inputEL.addEventListener('focus', () => {
      inputEL._focused = true;
      inputEL._initValue = inputEL.value;
    });
    inputEL.addEventListener('blur', () => {
      inputEL._focused = false;
    });
    inputEL.addEventListener('change', event => {
      DomUtils.acceptEvent(event);
      this._onInputConfirm(inputEL);
    });
    // NOTE: polymer can only listen to non-bubble event
    inputEL.addEventListener('input', event => {
      DomUtils.acceptEvent(event);
      this._onInputChange(inputEL);
    });
    inputEL.addEventListener('keydown', event => {
      // keydown 'enter'
      if (event.keyCode === 13) {
        DomUtils.acceptEvent(event);
        this._onInputConfirm(inputEL,true);
      }
      // keydown 'esc'
      else if (event.keyCode === 27) {
        DomUtils.acceptEvent(event);
        this._onInputCancel(inputEL,true);
      } else {
        // other behavior, don't do anything
        if ( this.readonly ) {
          // ctrl/cmd + copy
          if ( event.metaKey && event.keyCode === 67 ) {
            return;
          }

          DomUtils.acceptEvent(event);
        }
      }
    });
    inputEL.addEventListener('mousedown', event => {
      inputEL._mouseStartX = event.clientX;
      if ( !inputEL._focused ) {
        inputEL._selectAllWhenMouseUp = true;
      }
    });
    inputEL.addEventListener('mouseup', event => {
      event.stopPropagation();

      if ( inputEL._selectAllWhenMouseUp ) {
        inputEL._selectAllWhenMouseUp = false;

        // if we drag select, don't do anything
        if ( Math.abs(event.clientX - inputEL._mouseStartX) < 4 ) {
          inputEL.select();
        }
      }
    });
  },

  _unselect (inputEL) {
    inputEL.selectionStart = inputEL.selectionEnd = -1;
  }
};

module.exports = InputState;
