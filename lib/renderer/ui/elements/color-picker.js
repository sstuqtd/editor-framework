'use strict';

const Chroma = require('chroma-js');

const ElementUtils = require('./utils');
const MathUtils = require('../../../share/math');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

module.exports = ElementUtils.registerElement('ui-color-picker', {
  get value () { return this._value; },
  set value (val) {
    let rgba = Chroma(val).rgba();
    if ( rgba !== this._value ) {
      this._value = rgba;

      this._updateHue();
      this._updateAlpha();
      this._updateColor();
      this._updateSliders();
      this._updateHexInput();
    }
  },

  behaviors: [ Focusable ],

  template: `
    <div class="hbox">
      <div class="hue ctrl" tabindex="-1">
        <div class="hue-handle">
          <i class="icon-right-dir"></i>
        </div>
      </div>
      <div class="color ctrl" tabindex="-1">
        <div class="color-handle">
          <i class="icon-circle-empty"></i>
        </div>
      </div>
      <div class="alpha ctrl" tabindex="-1">
        <div class="alpha-handle">
          <i class="icon-left-dir"></i>
        </div>
      </div>
    </div>

    <div class="vbox">
      <div class="prop">
        <span class="red tag">R</span>
        <ui-slider id="r-slider"></ui-slider>
      </div>
      <div class="prop">
        <span class="green">G</span>
        <ui-slider id="g-slider"></ui-slider>
      </div>
      <div class="prop">
        <span class="blue">B</span>
        <ui-slider id="b-slider"></ui-slider>
      </div>
      <div class="prop">
        <span class="gray">A</span>
        <ui-slider id="a-slider"></ui-slider>
      </div>
      <div class="hex-field">
        <span>Hex Color</span>
        <ui-input id="hex-input"></ui-input>
      </div>
    </div>

    <div class="title">Presets</div>
    <div class="hbox presets">
      <div class="color-box" data-index="0"></div>
      <div class="color-box" data-index="1"></div>
      <div class="color-box" data-index="2"></div>
      <div class="color-box" data-index="3"></div>
      <div class="color-box" data-index="4"></div>
      <div class="color-box" data-index="5"></div>
      <div class="color-box" data-index="6"></div>
      <div class="color-box" data-index="7"></div>
      <div class="color-box" data-index="8"></div>
      <div class="color-box" data-index="9"></div>
      <div class="color-box" data-index="10"></div>
      <div class="color-box" data-index="11"></div>
      <div class="color-box" data-index="12"></div>
      <div class="color-box" data-index="13"></div>
    </div>
  `,

  style: ResMgr.getResource('editor-framework://dist/css/elements/color-picker.css'),

  $: {
    hueHandle: '.hue-handle',
    colorHandle: '.color-handle',
    alphaHandle: '.alpha-handle',

    hueCtrl: '.hue.ctrl',
    colorCtrl: '.color.ctrl',
    alphaCtrl: '.alpha.ctrl',

    sliderR: '#r-slider',
    sliderG: '#g-slider',
    sliderB: '#b-slider',
    sliderA: '#a-slider',

    hexInput: '#hex-input',
    colorPresets: '.color-box',
  },

  ready () {
    // TODO: load $colorPresets from window.localStorage

    // init _value
    let value = this.getAttribute('value');
    if ( value !== null ) {
      this._value = Chroma(value).rgba();
    } else {
      this._value = [255,255,255,1];
    }

    // update control
    this._updateHue();
    this._updateColor();
    this._updateAlpha();
    this._updateSliders();
    this._updateHexInput();

    //
    this._initFocusable(this);

    //
    this._initEvents();
  },

  created (color) {
    if ( color ) {
      this.value = color;
    }
  },

  hide ( confirm ) {
    DomUtils.fire(this, 'hide', {
      bubbles: false,
      detail: {
        confirm: confirm,
      }
    });
  },

  _initEvents () {
    this.addEventListener('keydown', event => {
      // if space or enter, hide for confirm
      if (
        event.keyCode === 13 ||
        event.keyCode === 32
      ) {
        DomUtils.acceptEvent(event);
        this.hide(true);
      }
      // if esc, hide for cancel
      else if ( event.keyCode === 27 ) {
        DomUtils.acceptEvent(event);
        this.hide(false);
      }
    });

    // hue-ctrl

    this.$hueCtrl.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
      this.$hueCtrl.focus();

      let alpha = this._value[3];

      this._initValue = this._value;
      this._dragging = true;

      let rect = this.$hueCtrl.getBoundingClientRect();
      let ratio = (event.clientY - rect.top)/this.$hueCtrl.clientHeight;

      this.$hueHandle.style.top = `${ratio*100}%`;
      let h = (1-ratio) * 360;
      let hsv = Chroma(this._value).hsv();

      this._value = Chroma(h,hsv[1],hsv[2],'hsv').rgba();
      this._value[3] = alpha;

      this._updateColor(h);
      this._updateAlpha();
      this._updateSliders();
      this._updateHexInput();

      this._emitChange();

      DomUtils.startDrag('ns-resize', event, event => {
        let ratio = (event.clientY - rect.top)/this.$hueCtrl.clientHeight;
        ratio = MathUtils.clamp( ratio, 0, 1 );

        this.$hueHandle.style.top = `${ratio*100}%`;
        let h = (1-ratio) * 360;
        let hsv = Chroma(this._value).hsv();

        this._value = Chroma(h,hsv[1],hsv[2],'hsv').rgba();
        this._value[3] = alpha;

        this._updateColor(h);
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitChange();
      }, () => {
        this._dragging = false;

        let ratio = parseFloat(this.$hueHandle.style.top)/100;
        let h = (1-ratio) * 360;

        this._updateColor(h);
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitConfirm();
      });
    });
    this.$hueCtrl.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._dragging ) {
          DomUtils.acceptEvent(event);

          this._dragging = false;
          DomUtils.cancelDrag();

          this._value = this._initValue;

          this._updateHue();
          this._updateColor();
          this._updateAlpha();
          this._updateSliders();
          this._updateHexInput();

          this._emitChange();
          this._emitCancel();
        }
      }
    });

    // alpha-ctrl

    this.$alphaCtrl.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
      this.$alphaCtrl.focus();

      this._initValue = this._value.slice();
      this._dragging = true;

      let rect = this.$alphaCtrl.getBoundingClientRect();
      let ratio = (event.clientY - rect.top)/this.$alphaCtrl.clientHeight;

      this.$alphaHandle.style.top = `${ratio*100}%`;
      this._value[3] = 1-ratio;

      this._updateSliders();
      this._emitChange();

      DomUtils.startDrag('ns-resize', event, event => {
        let ratio = (event.clientY - rect.top)/this.$hueCtrl.clientHeight;
        ratio = MathUtils.clamp( ratio, 0, 1 );

        this.$alphaHandle.style.top = `${ratio*100}%`;
        this._value[3] = 1-ratio;

        this._updateSliders();
        this._emitChange();
      }, () => {
        this._dragging = false;

        this._updateSliders();
        this._emitConfirm();
      });
    });
    this.$alphaCtrl.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._dragging ) {
          DomUtils.acceptEvent(event);

          this._dragging = false;
          DomUtils.cancelDrag();

          this._value = this._initValue;

          this._updateAlpha();
          this._updateSliders();

          this._emitChange();
          this._emitCancel();
        }
      }
    });

    // color-ctrl

    this.$colorCtrl.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
      this.$colorCtrl.focus();

      let hsv_h = (1-parseFloat(this.$hueHandle.style.top)/100) * 360;
      let alpha = this._value[3];
      this._initValue = this._value.slice();
      this._dragging = true;

      let rect = this.$colorCtrl.getBoundingClientRect();
      let x = (event.clientX - rect.left)/this.$colorCtrl.clientWidth;
      let y = (event.clientY - rect.top)/this.$colorCtrl.clientHeight;
      let c = y * y * ( 3 - 2 * y);
      c = c * 255;

      this.$colorHandle.style.left = `${x*100}%`;
      this.$colorHandle.style.top = `${y*100}%`;
      this.$colorHandle.style.color = Chroma(c, c, c).hex();

      this._value = Chroma(hsv_h,x,1-y,'hsv').rgba();
      this._value[3] = alpha;

      this._updateAlpha();
      this._updateSliders();
      this._updateHexInput();
      this._emitChange();

      DomUtils.startDrag('default', event, event => {
        let x = (event.clientX - rect.left)/this.$colorCtrl.clientWidth;
        let y = (event.clientY - rect.top)/this.$colorCtrl.clientHeight;

        x = MathUtils.clamp( x, 0, 1 );
        y = MathUtils.clamp( y, 0, 1 );
        let c = y * y * ( 3 - 2 * y);
        c = c * 255;

        this.$colorHandle.style.left = `${x*100}%`;
        this.$colorHandle.style.top = `${y*100}%`;
        this.$colorHandle.style.color = Chroma(c, c, c).hex();

        this._value = Chroma(hsv_h,x,1-y,'hsv').rgba();
        this._value[3] = alpha;

        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();
        this._emitChange();
      }, () => {
        this._dragging = false;

        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();
        this._emitConfirm();
      });
    });
    this.$colorCtrl.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._dragging ) {
          DomUtils.acceptEvent(event);

          this._dragging = false;
          DomUtils.cancelDrag();

          this._value = this._initValue;

          this._updateColor();
          this._updateAlpha();
          this._updateSliders();
          this._updateHexInput();

          this._emitChange();
          this._emitCancel();
        }
      }
    });

    // slider-r
    this.$sliderR.addEventListener('change', event => {
      event.stopPropagation();

      this._value[0] = parseInt(event.detail.value * 255);
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateHexInput();
      this._emitChange();
    });
    this.$sliderR.addEventListener('confirm', event => {
      event.stopPropagation();
      this._emitConfirm();
    });
    this.$sliderR.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitChange();
      this._emitCancel();
    });

    // slider-g
    this.$sliderG.addEventListener('change', event => {
      event.stopPropagation();

      this._value[1] = parseInt(event.detail.value * 255);
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateHexInput();
      this._emitChange();
    });
    this.$sliderG.addEventListener('confirm', event => {
      event.stopPropagation();
      this._emitConfirm();
    });
    this.$sliderG.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitChange();
      this._emitCancel();
    });

    // slider-b
    this.$sliderB.addEventListener('change', event => {
      event.stopPropagation();

      this._value[2] = parseInt(event.detail.value * 255);
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateHexInput();
      this._emitChange();
    });
    this.$sliderB.addEventListener('confirm', event => {
      event.stopPropagation();
      this._emitConfirm();
    });
    this.$sliderB.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitChange();
      this._emitCancel();
    });

    // slider-a
    this.$sliderA.addEventListener('change', event => {
      event.stopPropagation();

      this._value[3] = event.detail.value;
      this._updateAlpha();
      this._emitChange();
    });
    this.$sliderA.addEventListener('confirm', event => {
      event.stopPropagation();
      this._emitConfirm();
    });
    this.$sliderA.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitChange();
      this._emitCancel();
    });

    // hex-input
    this.$hexInput.addEventListener('change', event => {
      event.stopPropagation();
    });
    this.$hexInput.addEventListener('cancel', event => {
      event.stopPropagation();
    });
    this.$hexInput.addEventListener('confirm', event => {
      event.stopPropagation();

      let alpha = this._value[3];
      this._value = Chroma(event.detail.value).rgba();
      this._value[3] = alpha;

      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateSliders();
      this._updateHexInput();

      this._emitChange();
      this._emitConfirm();
    });
  },

  _updateHue () {
    let hsv = Chroma(this._value).hsv();
    if ( isNaN(hsv[0]) ) {
      hsv[0] = 360;
    }

    this.$hueHandle.style.top = `${(1-hsv[0]/360)*100}%`;
  },

  _updateColor (hComp) {
    let cval = Chroma(this._value);
    let hsv = cval.hsv();
    if ( isNaN(hsv[0]) ) {
      hsv[0] = 360;
    }
    let h = hComp === undefined ? hsv[0] : hComp;
    let s = hsv[1];
    let v = hsv[2];
    let c = 1-v;
    c = c * c * ( 3 - 2 * c);
    c = c * 255;

    this.$colorCtrl.style.backgroundColor = Chroma(h,1,1,'hsv').hex();
    this.$colorHandle.style.left = `${s*100}%`;
    this.$colorHandle.style.top = `${(1-v)*100}%`;
    this.$colorHandle.style.color = Chroma(c, c, c).hex();
  },

  _updateAlpha () {
    this.$alphaCtrl.style.backgroundColor = Chroma(this._value).hex();
    this.$alphaHandle.style.top = `${(1-this._value[3])*100}%`;
  },

  _updateSliders () {
    this.$sliderR.value = this._value[0]/255;
    this.$sliderG.value = this._value[1]/255;
    this.$sliderB.value = this._value[2]/255;
    this.$sliderA.value = this._value[3];
  },

  _updateHexInput () {
    this.$hexInput.value = Chroma(this._value).hex().toUpperCase();
  },

  _emitConfirm () {
    DomUtils.fire(this, 'confirm', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  _emitCancel () {
    DomUtils.fire(this, 'cancel', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  _emitChange () {
    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },
});
