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
    if ( panelEL ) {
      panelEL._setFocused(true);
    }
    _focusedPanel = panelEL;
  }
};

FocusMgr._setFocusElement = function ( el ) {
  if ( _focusedElement !== el ) {
    if ( _focusedElement ) {
      _focusedElement._setFocused(false);
    }
    if ( el ) {
      el._setFocused(true);
    }
    _focusedElement = el;
  }
};

FocusMgr._restoreFocusPanel = function () {
  // NOTE: if we have focused element, skip focused panel
  if ( _focusedElement ) {
    _focusedElement._setFocused(true);
    return;
  }

  if ( _focusedPanel ) {
    _focusedPanel._setFocused(true);
    _focusedPanel._focusActiveFrame();
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
