'use strict';

let FocusMgr = {};
module.exports = FocusMgr;

let _focusedPanel = null;
let _focusedElement = null;

// ==========================
// exports
// ==========================

FocusMgr._setFocusPanel = function ( panelEL ) {
  if ( _focusedPanel !== panelEL ) {
    if ( _focusedPanel ) {
      _focusedPanel._setFocused(false);
    }
    panelEL._setFocused(true);
    _focusedPanel = panelEL;
  }
};

Object.defineProperty(FocusMgr, 'focusedPanel', {
  enumerable: true,
  get () {
    return _focusedPanel;
  },
});

Object.defineProperty(FocusMgr, 'focusedElement', {
  enumerable: true,
  get () {
    return _focusedElement;
  },
});

// ==========================
// Dom
// ==========================

window.addEventListener('focus', () => {
  if ( _focusedPanel ) {
    _focusedPanel._setFocused(true);
  }
});

window.addEventListener('blur', () => {
  if ( _focusedPanel ) {
    _focusedPanel._setFocused(false);
  }
});
