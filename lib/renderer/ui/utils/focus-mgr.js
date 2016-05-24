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

FocusMgr._focusPrev = function () {
  let el, lastEL;
  if ( _focusedPanelFrame ) {
    el = _focusedPanelFrame._focusedElement;
    lastEL = _focusedPanelFrame._lastFocusedElement;
  } else {
    el = _focusedElement;
    lastEL = _lastFocusedElement;
  }

  //
  if ( el ) {
    let prev = FocusMgr._getPrevFocusable(el);
    if ( prev ) {
      FocusMgr._setFocusElement(prev);
    }
  } else {
    FocusMgr._setFocusElement(lastEL);
  }
};

FocusMgr._focusNext = function () {
  let el, lastEL;
  if ( _focusedPanelFrame ) {
    el = _focusedPanelFrame._focusedElement;
    lastEL = _focusedPanelFrame._lastFocusedElement;
  } else {
    el = _focusedElement;
    lastEL = _lastFocusedElement;
  }

  //
  if ( el ) {
    let next = FocusMgr._getNextFocusable(el);
    if ( next ) {
      FocusMgr._setFocusElement(next);
    }
  } else {
    FocusMgr._setFocusElement(lastEL);
  }
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

FocusMgr._setFocusElement = function ( el ) {
  // NOTE: disabled object can be focused, it just can not be navigate.
  //       (for example, disabled prop can be fold/foldup by left/right key)
  // if ( el && el.disabled ) {
  //   el = null;
  // }

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
      } else {
        _focusedPanelFrame.focus();
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

FocusMgr._getFirstFocusableFrom = function ( el, excludeSelf ) {
  if ( !excludeSelf && el.focusable && !el.disabled ) {
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
      if ( curEL === el ) {
        return null;
      }

      parentEL = parentEL.parentElement;
      curEL = curEL.nextElementSibling;
    }

    if ( curEL ) {
      if ( curEL.focusable && !curEL.disabled ) {
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

FocusMgr._getLastFocusableFrom = function ( el, excludeSelf ) {
  let lastFocusable = null;

  if ( !excludeSelf && el.focusable && !el.disabled ) {
    lastFocusable = el;
  }

  let parentEL = el, curEL = el;
  if ( !curEL.children.length ) {
    return lastFocusable;
  }

  curEL = curEL.children[0];
  while (1) {
    if ( !curEL ) {
      curEL = parentEL;
      if ( curEL === el ) {
        return lastFocusable;
      }

      parentEL = parentEL.parentElement;
      curEL = curEL.nextElementSibling;
    }

    if ( curEL ) {
      if ( curEL.focusable && !curEL.disabled ) {
        lastFocusable = curEL;
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
  let nextEL = FocusMgr._getFirstFocusableFrom(el, true);
  if ( nextEL ) {
    return nextEL;
  }

  let parentEL = el.parentElement, curEL = el.nextElementSibling;
  while (1) {
    if ( !curEL ) {
      curEL = parentEL;
      if ( curEL === null ) {
        return null;
      }

      parentEL = parentEL.parentElement;
      curEL = curEL.nextElementSibling;
    }

    if ( curEL ) {
      nextEL = FocusMgr._getFirstFocusableFrom(curEL);
      if ( nextEL ) {
        return nextEL;
      }

      curEL = curEL.nextElementSibling;
    }
  }
};

FocusMgr._getPrevFocusable = function ( el ) {
  let prevEL;
  let parentEL = el.parentElement, curEL = el.previousElementSibling;

  while (1) {
    if ( !curEL ) {
      curEL = parentEL;
      if ( curEL === null ) {
        return null;
      }
      // TODO
      // if ( curEL.focusable && !curEL.disabled ) {
      //   return curEL;
      // }

      parentEL = parentEL.parentElement;
      curEL = curEL.previousElementSibling;
    }

    if ( curEL ) {
      prevEL = FocusMgr._getLastFocusableFrom(curEL);
      if ( prevEL ) {
        return prevEL;
      }

      curEL = curEL.previousElementSibling;
    }
  }
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

// keydown Tab in capture phase
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

// keydown up/down arrow in bubble phase
window.addEventListener('keydown', event => {
  // up-arrow
  if (event.keyCode === 38) {
    DomUtils.acceptEvent(event);
    FocusMgr._focusPrev();
  }
  // down-arrow
  else if (event.keyCode === 40) {
    DomUtils.acceptEvent(event);
    FocusMgr._focusNext();
  }
});
