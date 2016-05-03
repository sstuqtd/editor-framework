'use strict';

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
    return this.getAttribute('focused');
  },

  /**
   * @property disabled
   */
  get disabled () {
    return this.getAttribute('disabled');
  },
  set disabled (val) {
    this.setAttribute('disabled', val);

    if ( val ) {
      this.style.pointerEvents = 'none';
    } else {
      this.style.pointerEvents = '';
    }
  },

  /**
   * @property navigable
   */
  get navigable () {
    return this.getAttribute('navigable');
  },
  set navigable (val) {
    this.setAttribute('navigable', val);
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
    if ( this._isDisabledInHierarchy() ) {
      return;
    }

    if ( focused ) {
      this.setAttribute('focused', '');
      if ( this.focusEls.length > 0 ) {
        this.focusEls[0].focus();
      }
    } else {
      this.removeAttribute('focused');
      if ( this.focusEls.length > 0 ) {
        this.focusEls[0].blur();
      }
    }
  },
};

module.exports = Focusable;
