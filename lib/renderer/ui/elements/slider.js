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
      <div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/slider.css'),
      root.firstChild
    );

    this._wrapper = root.querySelector('.wrapper');
    this._track = root.querySelector('.track');
    this._nubbin = root.querySelector('.nubbin');

    // init attr
    let attrMin = this.getAttribute('min');
    this.min = attrMin !== null ? parseFloat(attrMin) : 0.0;

    let attrMax = this.getAttribute('max');
    this.max = attrMax !== null ? parseFloat(attrMax) : 1.0;

    let attrValue = this.getAttribute('value');
    this.value = attrValue !== null ? parseFloat(attrValue) : 0.0;
    this.value = MathUtils.clamp( this.value, this.min, this.max );

    let ratio = (this.value-this.min)/(this.max-this.min);
    this._nubbin.style.left = `${ratio*100}%`;

    this._wrapper.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);

      let rect = this._track.getBoundingClientRect();
      let ratio = (event.clientX - rect.left)/this._track.clientWidth;

      this._nubbin.style.left = `${ratio*100}%`;

      DomUtils.startDrag('ew-resize', event, event => {
        let ratio = (event.clientX - rect.left)/this._track.clientWidth;
        ratio = MathUtils.clamp( ratio, 0, 1 );

        this._nubbin.style.left = `${ratio*100}%`;
        this.value = this.min + ratio * (this.max - this.min);

        DomUtils.fire(this, 'change', {
          bubbles: true,
          detail: {
            value: this.value,
          }
        });
      }, () => {
        DomUtils.fire(this, 'comfirm', {
          bubbles: true,
          detail: {
            value: this.value,
          }
        });
        DomUtils.fire(this, 'end-editing', { bubbles: true });
      });
    });

    //
    this._initFocusable(this);
  }
}

JS.addon(SliderElement.prototype, Focusable);

ui_slider.element = SliderElement;
