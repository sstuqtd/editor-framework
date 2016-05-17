'use strict';

// ==========================
// exports
// ==========================

function ui_slider (text) {
  let el = document.createElement('ui-slider');
  el.innerText = text;

  return el;
}

module.exports = ui_slider;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const MathUtils = require('../../../share/math');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

class SliderElement extends window.HTMLElement {
  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="wrapper">
        <div class="track"></div>
        <div class="nubbin"></div>
      </div>
      <input type="number"></input>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/slider.css'),
      root.firstChild
    );

    this._wrapper = root.querySelector('.wrapper');
    this._track = root.querySelector('.track');
    this._nubbin = root.querySelector('.nubbin');
    this._input = root.querySelector('input');

    // init attr
    let attrMin = this.getAttribute('min');
    this.min = attrMin !== null ? parseFloat(attrMin) : 0.0;

    let attrMax = this.getAttribute('max');
    this.max = attrMax !== null ? parseFloat(attrMax) : 1.0;

    let attrValue = this.getAttribute('value');
    this.value = attrValue !== null ? parseFloat(attrValue) : 0.0;
    this.value = this._initValue = MathUtils.clamp( this.value, this.min, this.max );

    this._step = (this.max - this.min)/100;
    this._dragging = false;

    //
    this._updateNubbinAndInput();

    //
    this._initFocusable(this);

    // process events
    this._wrapper.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);

      this._initValue = this.value;
      this._dragging = true;

      let rect = this._track.getBoundingClientRect();
      let ratio = (event.clientX - rect.left)/this._track.clientWidth;

      this._nubbin.style.left = `${ratio*100}%`;
      this.value = this.min + ratio * (this.max - this.min);
      this._input.value = this.value.toFixed(2);

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this.value,
        }
      });

      DomUtils.startDrag('ew-resize', event, event => {
        let ratio = (event.clientX - rect.left)/this._track.clientWidth;
        ratio = MathUtils.clamp( ratio, 0, 1 );

        this._nubbin.style.left = `${ratio*100}%`;
        this.value = this.min + ratio * (this.max - this.min);
        this._input.value = this.value.toFixed(2);

        DomUtils.fire(this, 'change', {
          bubbles: true,
          detail: {
            value: this.value,
          }
        });
      }, () => {
        this._dragging = false;
        this.confirm();
      });
    });

    this.addEventListener('keydown', this._keyDownHandler);
  }

  _keyDownHandler (event) {
    // keydown 'enter'
    if (event.keyCode === 13) {
      // TODO:
      // DomUtils.acceptEvent(event);
    }
    // keydown 'esc'
    else if (event.keyCode === 27) {
      DomUtils.acceptEvent(event);
      if ( this._dragging ) {
        this._dragging = false;
        DomUtils.cancelDrag();
        this.cancel();
      }
    }
    // left-arrow
    else if ( event.keyCode === 37 ) {
      DomUtils.acceptEvent(event);

      let step = this._step;
      if ( event.shiftKey ) {
        step *= 10.0;
      }
      this.value = MathUtils.clamp(this.value-step, this.min, this.max);
      this._initValue = this.value;
      this._updateNubbinAndInput();

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this.value,
        }
      });
    }
    // right-arrow
    else if ( event.keyCode === 39 ) {
      DomUtils.acceptEvent(event);

      let step = this._step;
      if ( event.shiftKey ) {
        step *= 10.0;
      }
      this.value = MathUtils.clamp(this.value+step, this.min, this.max);
      this._initValue = this.value;
      this._updateNubbinAndInput();

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this.value,
        }
      });
    }
  }

  _updateNubbinAndInput () {
    let ratio = (this.value-this.min)/(this.max-this.min);
    this._nubbin.style.left = `${ratio*100}%`;
    this._input.value = this.value.toFixed(2);
  }

  confirm () {
    this._initValue = this.value;
    this._updateNubbinAndInput();

    DomUtils.fire(this, 'confirm', {
      bubbles: true,
      detail: {
        value: this.value,
      },
    });
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }

  cancel () {
    this.value = this._initValue;
    this._updateNubbinAndInput();

    DomUtils.fire(this, 'change', {
      bubbles: true,
      detail: {
        value: this.value,
      },
    });
    DomUtils.fire(this, 'cancel', {
      bubbles: true,
      detail: {
        value: this.value,
      },
    });
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }
}

JS.addon(SliderElement.prototype, Focusable);

ui_slider.element = SliderElement;
