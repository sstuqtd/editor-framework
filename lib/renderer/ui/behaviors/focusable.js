'use strict';

// ==========================
// exports
// ==========================

let Focusable = {
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

  _initFocusable: function ( focusEls ) {
    if ( focusEls ) {
      if ( Array.isArray(focusEls) ) {
        this.focusEls = focusEls;
      }
      else {
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
    if ( this.disabled )
      return true;

    let parent = this.parentNode;
    while ( parent ) {
      if ( parent.disabled ) {
        return true;
      }

      parent = parent.parentNode;
    }

    return false;
  },

  _focus () {
    if ( this._isDisabledInHierarchy() ) {
      return;
    }

    if ( this.focusEls.length > 0 ) {
      this.focusEls[0]._focus();
    }
    this.focused = true;
  },

  _blur () {
    if ( this._isDisabledInHierarchy() )
      return;

    if ( this.focusEls.length > 0 ) {
      this.focusEls[0]._blur();
    }

    this.focused = false;
  },
};

module.exports = Focusable;
