'use strict';

const ElementUtils = require('./utils');
const MathUtils = require('../../../share/math');
const ResMgr = require('../utils/resource-mgr');

module.exports = ElementUtils.registerElement('ui-progress', {
  // range: 0-100
  get value () { return this._value; },
  set value ( val ) {
    if ( val === null || val === undefined ) {
      val = 0;
    }

    val = MathUtils.clamp( val, 0, 100 );

    if ( this._value !== val ) {
      this._value = val;
      this._updateProgressBar();
    }
  },

  template: `
    <div class="bar"></div>
  `,

  style: ResMgr.getResource('theme://elements/progress.css'),

  $: {
    bar: '.bar',
  },

  factoryImpl (progress) {
    if ( progress ) {
      this.value = progress;
    }
  },

  ready () {
    let val = parseFloat(this.getAttribute('value'));
    this._value = isNaN(val) ? 0 : val;

    this._updateProgressBar();
    // this.$bar.
  },

  _updateProgressBar () {
    this.$bar.style.width = `${this._value}%`;
  },
});
