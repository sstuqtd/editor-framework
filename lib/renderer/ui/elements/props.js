'use strict';

let Props = {};
module.exports = Props;

// ==========================
// internal
// ==========================

const Chroma = require('chroma-js');
const Prop = require('./prop');

function parseString (txt) { return txt; }
function parseBoolean (txt) {
  if ( txt === 'false' ) {
    return false;
  }
  return txt !== null;
}
function parseColor (txt) {
  return Chroma(txt).rgba();
}

// ==========================
// export
// ==========================

// string
Props.string = {
  value: parseString,

  attrs: {
    multiline: parseBoolean,
  },

  template ( attrs ) {
    let tmpl;
    if ( attrs.multiline ) {
      tmpl = `
        <ui-text-area class="flex-1" resize-v></ui-text-area>
      `;
    } else {
      tmpl = `
        <ui-input class="flex-1"></ui-input>
      `;
    }
    return tmpl;
  },

  ready () {
    if ( this.attrs.multiline ) {
      this.autoHeight = true;
    }
    this._input = this.children[0];
    this._input.value = this.value;
  },

  attrsChanged ( newAttrs, oldAttrs ) {
    if ( newAttrs.multiline !== oldAttrs.multiline ) {
      this.regen(); // re-generate template
      return;
    }
  },

  valueChanged ( newValue ) {
    this._input.value = newValue;
  },
};

// number
Props.number = {
  value: parseFloat,

  attrs: {
    min: parseFloat,
    max: parseFloat,
    step: parseFloat,
    precision: parseInt,
  },

  template: `
    <ui-num-input class="flex-1"></ui-num-input>
  `,

  ready () {
    this._input = this.children[0];

    this._input.min = this.attrs.min;
    this._input.max = this.attrs.max;
    this._input.step = this.attrs.step;
    this._input.precision = this.attrs.precision;

    this._input.value = this.value;
  },

  attrsChanged ( newAttrs ) {
    this._input.min = newAttrs.min;
    this._input.max = newAttrs.max;
    this._input.step = newAttrs.step;
    this._input.precision = newAttrs.precision;
  },

  valueChanged ( newValue ) {
    this._input.value = newValue;
  },
};

// boolean
Props.boolean = {
  value: txt => {
    if ( txt === 'false' || txt === '0' ) {
      return false;
    }
    if ( txt === 'true' ) {
      return true;
    }
    return txt !== null;
  },

  template: `
    <ui-checkbox class="flex-1"></ui-checkbox>
  `,

  ready () {
    this._input = this.children[0];
    this._input.value = this.value;
  },

  valueChanged ( newValue ) {
    this._input.value = newValue;
  },
};

// object
Props.object = {
  value: txt => {
    return JSON.parse(txt);
  },

  template: `
    <div class="child"></div>
  `,

  ready () {
    this.foldable = true;

    let childWrapper = this.querySelector('.child');
    let obj = this.value;
    for ( let name in obj ) {
      let childVal = obj[name];
      let childProp = new Prop( name, childVal, null, null,  this.indent+1 );
      childWrapper.appendChild(childProp);
    }
  },

  valueChanged () {
    // TODO: diff newValue, oldValue
    this.regen();
  },
};

// color
Props.color = {
  value: parseColor,

  template: `
    <ui-color class="flex-1"></ui-color>
  `,

  ready () {
    this._input = this.children[0];
    this._input.value = this.value;
  },

  valueChanged (newValue) {
    this._input.value = newValue;
  },
};
