'use strict';

let FocusMgr = {};
module.exports = FocusMgr;

// requires
const DockPanel = require('../panel/panel.js');

// panel focus
let _focusedPanelFrame = null;

// standalone focus
let _focusedElement = null;
// let _lastFocusedElement = null;

// ==========================
// exports
// ==========================

FocusMgr._setFocusPanelFrame = function ( panelFrame ) {
  let blurPanel, focusPanel;

  // process panel
  if ( _focusedPanelFrame ) {
    blurPanel = _focusedPanelFrame.parentElement;
  }

  if ( panelFrame ) {
    focusPanel = panelFrame.parentElement;
  }

  if ( blurPanel !== focusPanel ) {
    if ( blurPanel ) {
      blurPanel._setFocused(false);
    }

    if ( focusPanel ) {
      focusPanel._setFocused(true);
    }
  }

  // process panel frame
  if ( _focusedPanelFrame !== panelFrame ) {
    if ( _focusedPanelFrame ) {
      _focusedPanelFrame.blur();

      // TODO: blur elements
    }

    if ( panelFrame ) {
      panelFrame.focus();

      // TODO: focus elements
    }

    _focusedPanelFrame = panelFrame;
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

FocusMgr._getFocusableParent = function ( el ) {
  let parent = el.parentNode;
  // shadow root
  if ( parent.host ) {
    parent = parent.host;
  }

  while ( parent ) {
    if ( parent.focusable ) {
      return parent;
    }

    parent = parent.parentNode;
    // shadow root
    if ( parent && parent.host ) {
      parent = parent.host;
    }
  }

  return null;
};

FocusMgr._focusParent = function ( el ) {
  let parent = FocusMgr._getFocusableParent(el);
  if ( parent ) {
    if ( parent instanceof DockPanel ) {
      FocusMgr._setFocusElement(null);
      parent.activeTab.frameEL.focus();
    } else {
      FocusMgr._setFocusElement(parent);
    }
  }
};

FocusMgr._restoreFocusPanel = function () {
  // NOTE: if we have focused element, skip focused panel
  if ( _focusedElement ) {
    _focusedElement._setFocused(true);
    return;
  }

  if ( _focusedPanelFrame ) {
    let panel = _focusedPanelFrame.parentElement;
    panel._setFocused(true);
    _focusedPanelFrame.focus();
  }
};

Object.defineProperty(FocusMgr, 'focusedPanelFrame', {
  enumerable: true,
  get () {
    return _focusedPanelFrame;
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
  if ( _focusedPanelFrame ) {
    let panel = _focusedPanelFrame.parentElement;
    panel._setFocused(true);
  }
});

window.addEventListener('blur', () => {
  if ( _focusedPanelFrame ) {
    let panel = _focusedPanelFrame.parentElement;
    panel._setFocused(false);
  }
});
