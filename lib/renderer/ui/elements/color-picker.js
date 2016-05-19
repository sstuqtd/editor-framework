'use strict';

// ==========================
// exports
// ==========================

function ui_color_picker (color) {
  let el = document.createElement('ui-color-picker');
  el.value = color;

  return el;
}

module.exports = ui_color_picker;

// ==========================
// internal
// ==========================

const Chroma = require('chroma-js');

const JS = require('../../../share/js-utils');
const DomUtils = require('../utils/dom-utils');
const Focusable = require('../behaviors/focusable');

class ColorPickerElement extends window.HTMLElement {
  get value () { return this._value; }
  set value (val) {
    let rgba = Chroma(val).rgba();
    if ( rgba !== this._value ) {
      this._value = rgba;

      // this._updateRGB();
      // this._updateAlpha();
    }
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="hbox">
        <div class="hue ctrl">
          <div class="hue-handle">
            <i class="icon-right-dir"></i>
          </div>
        </div>
        <div class="color ctrl">
          <div class="color-handle">
            <i class="icon-circle-empty"></i>
          </div>
        </div>
        <div class="opacity ctrl">
          <div class="opacity-handle">
            <i class="icon-left-dir"></i>
          </div>
        </div>
      </div>

      <div class="vbox">
        <div class="prop">
          <span class="red tag">R</span>
          <ui-slider></ui-slider>
        </div>
        <div class="prop">
          <span class="green">G</span>
          <ui-slider></ui-slider>
        </div>
        <div class="prop">
          <span class="blue">B</span>
          <ui-slider></ui-slider>
        </div>
        <div class="prop">
          <span class="gray">A</span>
          <ui-slider></ui-slider>
        </div>
        <div class="hex-field">
          <span>Hex Color #</span>
          <ui-input></ui-input>
        </div>
      </div>

      <div class="title">Presets</div>
      <div class="hbox presets">
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
        <div class="color-box"></div>
      </div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/color-picker.css'),
      root.firstChild
    );

    this._initFocusable(this);
  }
}

JS.addon(ColorPickerElement.prototype, Focusable);

ui_color_picker.element = ColorPickerElement;
