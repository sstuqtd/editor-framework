'use strict';

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const ButtonState = require('../behaviors/button-state');

module.exports = ElementUtils.registerElement('ui-button', {
  behaviors: [ Focusable, Disable, ButtonState ],

  template: `
    <div class="inner">
      <content></content>
    </div>
  `,

  style: ResMgr.getResource('editor-framework://dist/css/elements/button.css'),

  ready () {
    this._initFocusable(this);
    this._initDisable(false);
    this._initButtonState();
  },

  created (text) {
    if ( text ) {
      this.innerText = text;
    }
  },
});
