'use strict';

let FocusMgr = {};
module.exports = FocusMgr;

// requires
const DockPanel = require('../panel/panel.js');
const DomUtils = require('./dom-utils.js');

// panel focus
let _focusedPanelFrame = null;
let _lastFocusedPanelFrame = null;

// global focus
let _focusedElement = null;
let _lastFocusedElement = null;

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

      // blur element
      if ( _focusedPanelFrame._focusedElement ) {
        _focusedPanelFrame._focusedElement._setFocused(false);
      }
    }

    _lastFocusedPanelFrame = _focusedPanelFrame;
    _focusedPanelFrame = panelFrame;

    if ( panelFrame ) {
      panelFrame.focus();

      // focus element
      if ( panelFrame._focusedElement ) {
        panelFrame._focusedElement._setFocused(true);
      }
    }
  }
};

FocusMgr._setFocusElement = function ( el ) {
  // process focus element in focused panel frame
  if ( _focusedPanelFrame ) {
    let focusedElement = _focusedPanelFrame._focusedElement;
    if ( focusedElement !== el ) {
      if ( focusedElement ) {
        focusedElement._setFocused(false);
      }

      _focusedPanelFrame._lastFocusedElement = focusedElement;
      _focusedPanelFrame._focusedElement = el;

      _lastFocusedElement = _focusedElement;
      _focusedElement = el;

      if ( el ) {
        el._setFocused(true);
      }
    }

    return;
  }

  // otherwise process focus element as if it is standalone
  if ( _focusedElement !== el ) {
    if ( _focusedElement ) {
      _focusedElement._setFocused(false);
    }

    _lastFocusedElement = _focusedElement;
    _focusedElement = el;

    if ( el ) {
      el._setFocused(true);
    }
  }
};

FocusMgr._getFocusableFrom = function ( el, excludeSelf ) {
  if ( !excludeSelf && el.focusable ) {
    return el;
  }

  let parentEL = el, curEL = el;
  if ( !curEL.children.length ) {
    return null;
  }

  curEL = curEL.children[0];
  while (1) {
    if ( !curEL ) {
      curEL = parentEL;
      parentEL = parentEL.parentElement;
      if ( curEL === el ) {
        return null;
      }
      curEL = curEL.nextElementSibling;
    }

    if ( curEL ) {
      if ( curEL.focusable ) {
        return curEL;
      }

      if ( curEL.children.length ) {
        parentEL = curEL;
        curEL = curEL.children[0];
      } else {
        curEL = curEL.nextElementSibling;
      }
    }
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

FocusMgr._getNextFocusable = function ( el ) {
  // let nextEL = el.nextElementSibling;
  // while ( nextEL ) {
  // }
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
  if ( _focusedPanelFrame ) {
    let panel = _focusedPanelFrame.parentElement;
    panel._setFocused(true);

    // NOTE: if we have focused element, skip focus panel frame
    if ( _focusedPanelFrame._focusedElement ) {
      _focusedPanelFrame._focusedElement._setFocused(true);
      return;
    }

    _focusedPanelFrame.focus();
  }
};

FocusMgr._focusPrev = function () {
};

FocusMgr._focusNext = function () {
};

Object.defineProperty(FocusMgr, 'lastFocusedPanelFrame', {
  enumerable: true,
  get () {
    return _lastFocusedPanelFrame;
  },
});

Object.defineProperty(FocusMgr, 'focusedPanelFrame', {
  enumerable: true,
  get () {
    return _focusedPanelFrame;
  },
});

Object.defineProperty(FocusMgr, 'lastFocusedElement', {
  enumerable: true,
  get () {
    return _lastFocusedElement;
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

window.addEventListener('keydown', event => {
  // tab
  if ( event.keyCode === 9 ) {
    DomUtils.acceptEvent(event);

    if ( event.shiftKey ) {
      FocusMgr._focusPrev();
    } else {
      FocusMgr._focusNext();
    }
  }
}, true);

window.addEventListener('keydown', event => {
  // up-arrow
  if (event.keyCode === 38) {
    // TODO
    DomUtils.acceptEvent(event);
  }
  // down-arrow
  else if (event.keyCode === 40) {
    // TODO
    DomUtils.acceptEvent(event);
  }
});
