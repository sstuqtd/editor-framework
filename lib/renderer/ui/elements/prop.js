'use strict';

// ==========================
// exports
// ==========================

function ui_prop ( name ) {
  let el = document.createElement('ui-prop');
  el.name = name;

  return el;
}

module.exports = ui_prop;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

class PropElement extends window.HTMLElement {

  /**
   * @property readonly
   */
  get readonly () {
    return this.getAttribute('readonly') !== null;
  }
  set readonly (val) {
    if (val) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
  }

  /**
   * @property selected
   */
  get selected () {
    return this.getAttribute('selected') !== null;
  }
  set selected (val) {
    if (val) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="wrapper">
        <div class="label">
          <i class="fold icon-fold-up"></i>
          <span class="text"></span>
        </div>
        <content select=":not(.custom-block)"></content>
      </div>
      <content select=".custom-block"></content>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/prop.css'),
      root.firstChild
    );

    this._label = root.querySelector('.label');
    this._foldIcon = root.querySelector('.fold');
    this._text = root.querySelector('.text');

    this._folded = false;

    // init _name
    let name = this.getAttribute('name');
    if ( name !== null ) {
      this._name = name;
    } else {
      this._name = '-';
    }

    // init _indent
    let indent = this.getAttribute('indent');
    if ( indent !== null ) {
      this._label.style.paddingLeft = parseInt(indent) * 13 + 'px';
    }

    // update label
    this._text.innerText = this._name;

    this._initFocusable(this);
    this._initEvents();
  }

  fold () {
    if ( !this._folded ) {
      this._folded = true;
      this._foldIcon.classList.remove('icon-fold-up');
      this._foldIcon.classList.add('icon-fold');

      let customList = this.querySelectorAll('.custom-block');
      for ( let i = 0; i < customList.length; ++i ) {
        let el = customList[i];
        el._oldDisplay = el.style.display;
        el.style.display = 'none';
      }
    }
  }

  foldup () {
    if ( this._folded ) {
      this._folded = false;
      this._foldIcon.classList.remove('icon-fold');
      this._foldIcon.classList.add('icon-fold-up');

      let customList = this.querySelectorAll('.custom-block');
      for ( let i = 0; i < customList.length; ++i ) {
        let el = customList[i];
        el.style.display = el._oldDisplay;
      }
    }
  }

  _getFocusableElement () {
    let focusableEL = this;
    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];
      if ( el.focusable ) {
        focusableEL = el;
        break;
      }
    }
    return focusableEL;
  }

  _initEvents () {
    this.addEventListener('focus-changed', event => {
      event.stopPropagation();
      this.selected = event.detail.focused;
    });

    this.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);

      let focusableEL = this._getFocusableElement();
      FocusMgr._setFocusElement(focusableEL);
    });

    this.addEventListener('keydown', event => {
      // keydown 'enter'
      if (event.keyCode === 13) {
      }
      // keydown 'left'
      else if (event.keyCode === 37) {
        DomUtils.acceptEvent(event);
        this.fold();
      }
      // keydown 'right'
      else if (event.keyCode === 39) {
        DomUtils.acceptEvent(event);
        this.foldup();
      }
    });

    this._foldIcon.addEventListener('mousedown', () => {
      // NOTE: do not stopPropagation
      if ( this._folded ) {
        this.foldup();
      } else {
        this.fold();
      }
    });
  }
}

JS.addon(PropElement.prototype, Focusable);

ui_prop.element = PropElement;
