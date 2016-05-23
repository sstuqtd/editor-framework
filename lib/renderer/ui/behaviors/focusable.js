'use strict';

const DomUtils = require('../utils/dom-utils');

// ==========================
// exports
// ==========================

let Focusable = {
  get focusable () {
    return true;
  },

  /**
   * @property focused
   * @readonly
   */
  get focused () {
    return this.getAttribute('focused') !== null;
  },

  /**
   * @property disabled
   */
  get disabled () {
    return this.getAttribute('disabled') !== null;
  },
  set disabled (val) {
    if ( val ) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  },

  /**
   * @property unnavigable
   */
  get unnavigable () {
    return this.getAttribute('unnavigable') !== null;
  },
  set unnavigable (val) {
    if ( val ) {
      this.setAttribute('unnavigable', '');
    } else {
      this.removeAttribute('unnavigable');
    }
  },

  /**
   * @property loopable
   */
  get loopable () {
    return this.getAttribute('loopable') !== null;
  },
  set loopable (val) {
    if ( val ) {
      this.setAttribute('loopable', '');
    } else {
      this.removeAttribute('loopable');
    }
  },

  _initFocusable ( focusEls ) {
    if ( focusEls ) {
      if ( Array.isArray(focusEls) ) {
        this.focusEls = focusEls;
      } else {
        this.focusEls = [focusEls];
      }
    } else {
      this.focusEls = [];
    }

    // NOTE: always make sure this element focusable
    this.tabIndex = -1;

    // REF: http://webaim.org/techniques/keyboard/tabindex
    for ( let i = 0; i < this.focusEls.length; ++i ) {
      let el = this.focusEls[i];
      el.tabIndex = -1;
    }
  },

  _isDisabledInHierarchy () {
    if ( this.disabled ) {
      return true;
    }

    let parent = this.parentNode;
    while ( parent ) {
      if ( parent.disabled ) {
        return true;
      }

      parent = parent.parentNode;
    }

    return false;
  },

  // NOTE: only invoked by FocusMgr
  _setFocused ( focused ) {
    // NOTE: disabled object can be focused, but can not be navigate
    // if ( this._isDisabledInHierarchy() ) {
    //   return;
    // }

    if ( this.focused === focused ) {
      return;
    }

    if ( focused ) {
      this.setAttribute('focused', '');

      if ( this.focusEls.length > 0 ) {
        let focusEl = this.focusEls[0];
        if ( focusEl === this ) {
          focusEl.focus();
        } else {
          if ( focusEl.focusable ) {
            focusEl._setFocused(true);
          } else {
            focusEl.focus();
          }
        }
      }
    } else {
      this.removeAttribute('focused');

      this.focusEls.forEach(el => {
        if ( el.focusable && el.focused ) {
          el._setFocused(false);
        }
      });
    }

    DomUtils.fire(this, 'focus-changed', {
      bubbles: true,
      detail: {
        focused: this.focused,
      },
    });
  },
};

module.exports = Focusable;
